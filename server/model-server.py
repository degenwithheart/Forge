#!/usr/bin/env python3
"""
FastAPI server for model inference using transformers library
Handles .safetensor models and other HuggingFace model formats
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import pipeline, AutoConfig
import logging
import os
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model-server")

app = FastAPI(title="FORGE Model Server")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get configuration from environment
HF_TOKEN = os.getenv("HF_TOKEN", None)
INFERENCE_MODE = os.getenv("INFERENCE_MODE", "download").lower()  # "download" or "cache"

logger.info(f"Inference mode: {INFERENCE_MODE}")

if HF_TOKEN:
    from huggingface_hub import login
    try:
        login(token=HF_TOKEN)
        logger.info("Logged into HuggingFace Hub")
    except Exception as e:
        logger.warning(f"Failed to login to HuggingFace: {e}")

# Global inference mode (can be toggled at runtime)
inference_mode = INFERENCE_MODE

@app.get("/config")
def get_config():
    """Get current server configuration including inference mode"""
    return {
        "mode": inference_mode,
        "available_modes": ["cache", "download"],
        "hf_token_available": bool(HF_TOKEN),
        "cuda_available": torch.cuda.is_available(),
    }

@app.post("/config/mode")
def set_inference_mode(mode: dict):
    """Change inference mode at runtime"""
    global inference_mode
    requested_mode = mode.get("mode", "download").lower()
    
    if requested_mode not in ["cache", "download"]:
        raise HTTPException(status_code=400, detail="Mode must be 'cache' or 'download'")
    
    inference_mode = requested_mode
    logger.info(f"Inference mode changed to: {inference_mode}")
    
    return {
        "status": "ok",
        "mode": inference_mode,
    }

class LoadModelRequest(BaseModel):
    model_id: str
    model_name: str
    task: str = "text-generation"

class InferenceRequest(BaseModel):
    model_id: str
    prompt: str
    temperature: float = 0.7
    top_p: float = 0.95
    max_tokens: int = 256
    mode: str = None  # Optional override: "cache" or "download" (uses env default if None)

class UnloadRequest(BaseModel):
    model_id: str

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "FORGE Model Server",
        "endpoints": {
            "load": "POST /load",
            "infer": "POST /infer",
            "unload": "POST /unload",
            "list": "GET /models",
            "info": "GET /info",
        }
    }

@app.get("/info")
def info():
    """Get server info and capabilities"""
    return {
        "device": str(torch.device("cuda" if torch.cuda.is_available() else "cpu")),
        "cuda_available": torch.cuda.is_available(),
        "hf_token_available": bool(HF_TOKEN),
        "supported_tasks": [
            "text-generation",
            "text2text-generation",
            "question-answering",
            "feature-extraction",
            "text-classification",
            "token-classification",
        ],
    }

def infer_task_from_config(model_id: str) -> str:
    """Try to infer task type from model config"""
    try:
        config = AutoConfig.from_pretrained(model_id, trust_remote_code=True)
        
        # Check architecture in config
        arch = getattr(config, 'architectures', [])
        if arch:
            arch_lower = arch[0].lower() if isinstance(arch, list) else str(arch).lower()
            
            if 'causal' in arch_lower or 'gpt' in arch_lower or 'llama' in arch_lower or 'qwen' in arch_lower or 'mistral' in arch_lower:
                return 'text-generation'
            if 't5' in arch_lower or 'bart' in arch_lower or 'pegasus' in arch_lower:
                return 'text2text-generation'
            if 'question' in arch_lower or 'qa' in arch_lower:
                return 'question-answering'
            if 'bert' in arch_lower or 'roberta' in arch_lower or 'electra' in arch_lower:
                return 'feature-extraction'
        
        # Fallback to default based on model name
        model_lower = model_id.lower()
        if 'gpt2' in model_lower or 'gpt' in model_lower or 'qwen' in model_lower or 'llama' in model_lower or 'mistral' in model_lower:
            return 'text-generation'
        if 't5' in model_lower or 'bart' in model_lower or 'pegasus' in model_lower:
            return 'text2text-generation'
        if 'bert' in model_lower:
            return 'feature-extraction'
            
    except Exception as e:
        logger.warning(f"Could not infer task from config: {e}")
    
    return 'text-generation'

@app.post("/load")
def load_model(request: LoadModelRequest):
    """Load a model into memory"""
    try:
        model_id = request.model_id
        
        # Check if already loaded
        if model_id in model_cache:
            logger.info(f"Model {model_id} already loaded")
            return {"status": "loaded", "model_id": model_id, "task": model_cache[model_id]["task"]}
        
        logger.info(f"Loading model: {model_id}")
        
        # First try to infer task from config if not explicitly provided
        task = request.task
        if task == "text-generation":  # Default, try to infer better
            task = infer_task_from_config(model_id)
            logger.info(f"Inferred task: {task}")
        
        try:
            device = 0 if torch.cuda.is_available() else -1
            logger.info(f"Using device: {'GPU' if device >= 0 else 'CPU'}")
            
            # Load the pipeline
            pipe = pipeline(
                task,
                model=model_id,
                device=device,
                trust_remote_code=True,
            )
            
            model_cache[model_id] = {
                "pipeline": pipe,
                "task": task,
                "name": request.model_name,
            }
            logger.info(f"Successfully loaded {model_id}")
            return {
                "status": "loaded",
                "model_id": model_id,
                "task": task,
                "message": f"Model {request.model_name} loaded successfully",
                "device": "GPU" if device >= 0 else "CPU"
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Pipeline loading error for {model_id}: {error_msg}")
            
            if "404" in error_msg or "not found" in error_msg.lower():
                raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found on HuggingFace")
            elif "gated" in error_msg.lower() or "permission" in error_msg.lower():
                raise HTTPException(status_code=403, detail=f"Model '{model_id}' is gated. Set HF_TOKEN environment variable and accept license on huggingface.co")
            elif "cuda" in error_msg.lower() or "memory" in error_msg.lower():
                raise HTTPException(status_code=400, detail=f"Out of GPU memory. Try a smaller model")
            else:
                raise HTTPException(status_code=400, detail=f"Failed to load model: {error_msg}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Load endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def infer_hf_api(model_id: str, prompt: str, temperature: float, top_p: float, max_tokens: int):
    """Proxy inference request to HuggingFace Inference API (cache mode)"""
    try:
        url = f"https://api-inference.huggingface.co/models/{model_id}"
        
        headers = {
            "Authorization": f"Bearer {HF_TOKEN}" if HF_TOKEN else "",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_length": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "do_sample": True,
            },
            "wait_for_model": True,  # Wait if model is loading
        }
        
        logger.info(f"[CACHE MODE] Proxying to HuggingFace API: {model_id}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        # HuggingFace API returns different formats depending on task
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                output = result[0]["generated_text"]
            else:
                output = str(result[0])
        else:
            output = str(result)
        
        logger.info(f"[CACHE MODE] Inference successful for {model_id}")
        return output
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="HuggingFace API timeout - model may be overloaded")
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            raise HTTPException(status_code=403, detail="Model is gated or requires authentication")
        elif e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Model not found on HuggingFace")
        else:
            raise HTTPException(status_code=500, detail=f"HuggingFace API error: {e.response.text}")
    except Exception as e:
        logger.error(f"HuggingFace API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reach HuggingFace API: {str(e)}")

@app.post("/infer")
def infer(request: InferenceRequest):
    """Run inference on a loaded model (mode: download or cache)"""
    try:
        model_id = request.model_id
        
        # Determine inference mode: use request override or fall back to global/env setting
        mode = request.mode.lower() if request.mode else inference_mode
        
        # Route based on inference mode
        if mode == "cache":
            logger.info(f"[CACHE MODE] Using HuggingFace API for {model_id}")
            output = infer_hf_api(model_id, request.prompt, request.temperature, request.top_p, request.max_tokens)
            return {
                "model_id": model_id,
                "task": "unknown",
                "prompt": request.prompt,
                "output": output,
                "status": "success",
                "mode": "cache"
            }
        
        # Default: download mode (use local loaded model)
        if model_id not in model_cache:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not loaded. Load it first or use 'cache' mode.")
        
        cached = model_cache[model_id]
        pipeline_fn = cached["pipeline"]
        task = cached["task"]
        
        logger.info(f"[DOWNLOAD MODE] Running inference on {model_id}: {request.prompt[:50]}...")
        
        try:
            if task == "text-generation":
                result = pipeline_fn(
                    request.prompt,
                    max_length=request.max_tokens + len(request.prompt.split()),
                    temperature=request.temperature,
                    top_p=request.top_p,
                    do_sample=True,
                )
                return {
                    "model_id": model_id,
                    "task": task,
                    "prompt": request.prompt,
                    "output": result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", str(result)),
                    "status": "success",
                    "mode": "download"
                }
            
            elif task == "text2text-generation":
                result = pipeline_fn(request.prompt, max_length=request.max_tokens)
                return {
                    "model_id": model_id,
                    "task": task,
                    "prompt": request.prompt,
                    "output": result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", str(result)),
                    "status": "success",
                    "mode": "download"
                }
            
            elif task == "feature-extraction":
                return {
                    "model_id": model_id,
                    "task": task,
                    "prompt": request.prompt,
                    "output": "Embeddings generated (embedding vectors not serializable)",
                    "status": "success",
                    "mode": "download"
                }
            
            elif task == "text-classification":
                result = pipeline_fn(request.prompt)
                return {
                    "model_id": model_id,
                    "task": task,
                    "prompt": request.prompt,
                    "output": str(result),
                    "status": "success",
                    "mode": "download"
                }
            
            else:
                result = pipeline_fn(request.prompt)
                return {
                    "model_id": model_id,
                    "task": task,
                    "prompt": request.prompt,
                    "output": str(result),
                    "status": "success",
                    "mode": "download"
                }
                
        except Exception as e:
            logger.error(f"Inference error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Infer endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/unload")
def unload_model(request: UnloadRequest):
    """Unload a model from memory"""
    try:
        model_id = request.model_id
        if model_id in model_cache:
            del model_cache[model_id]
            logger.info(f"Unloaded {model_id}")
            return {"status": "unloaded", "model_id": model_id}
        else:
            return {"status": "not_loaded", "model_id": model_id, "detail": "Model was not loaded"}
    except Exception as e:
        logger.error(f"Unload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
def list_models():
    """List all loaded models"""
    return {
        "count": len(model_cache),
        "models": [
            {
                "model_id": k,
                "name": v.get("name", k),
                "task": v.get("task", "unknown"),
            }
            for k, v in model_cache.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
