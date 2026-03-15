# FORGE End-to-End Testing Guide

## System Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- 8GB+ RAM (or adjust model size)
- GPU (optional but recommended for speed)

### Installation

**Python Backend:**
```bash
cd server
pip install -r requirements.txt
```

**Frontend:**
```bash
cd src
npm install  # Already done if you've been working on it
```

## Starting the System

### Terminal 1 - Python Model Server
```bash
cd /Users/degenwithheart/Downloads/Forge/server
python model-server.py
```

Wait for:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5000
```

### Terminal 2 - React Frontend
```bash
cd /Users/degenwithheart/Downloads/Forge/src
npm run dev
```

Wait for:
```
  ➜  Local:   http://localhost:8080/
```

## Browser Testing

Open http://localhost:8080 in Chrome/Firefox/Safari

### Test 1: Model Loading (Must Pass)

**Simple text model:**
1. Search for `gpt2` in ModelLibrary
2. Click Load button
3. Observe toasts:
   - "📥 Loading gpt2..."
   - "⚙️ Initializing text-generation pipeline..."
   - "✅ gpt2 ready!"
4. Button changes to "Unload"
5. ✅ PASS: Model loaded successfully

**Check Python server logs:**
```
INFO:model-server:Loading model: openai-community/gpt2
model.safetensors: 100%|███| 548M/548M [01:52<00:00, 4.85MB/s]
INFO:model-server:Successfully loaded openai-community/gpt2
INFO:     127.0.0.1:xxxxx - "POST /load HTTP/1.1" 200 OK
```

### Test 2: Inference (Must Pass)

**Prerequisites:** gpt2 loaded from Test 1

1. Enter prompt: `"The future of AI is"`
2. Click "Run" or press Ctrl+Enter
3. Observe OutputStream panel filling with generated text
4. Check telemetry: TPS (tokens/second) shown
5. ✅ PASS: Inference completes and shows output

**Example output:**
```
The future of AI is bright and full of possibility. We have the tools to build 
better systems that can help us solve complex problems. But we also need to be 
careful about how we use these tools...
```

### Test 3: Persistence (Must Pass)

**Prerequisites:** gpt2 loaded from Test 1-2

1. Refresh page (F5)
2. Wait for page to reload
3. Observe ModelLibrary still shows gpt2 with "Unload" button
4. Model cache shows in localStorage (DevTools > Application > Local Storage)
5. ✅ PASS: Model persisted across reload

### Test 4: Unload & Reload (Must Pass)

1. Click "Unload" on gpt2
2. Card button changes back to "Load"
3. Verify Python server logs show `Unloaded openai-community/gpt2`
4. Reload page (F5)
5. gpt2 no longer loaded
6. Reload again
7. Still not loaded (ephemeral state)
8. ✅ PASS: Unload works and doesn't persist

### Test 5: Multiple Models (Must Pass)

1. Load gpt2
2. Search new model: `bert` (search DistilBERT)
3. Load DistilBERT
4. ModelLibrary shows both models
5. Telemetry panel shows "2 models loaded"
6. Unload gpt2
7. DistilBERT still loaded
8. ✅ PASS: Multiple models coexist correctly

### Test 6: Error Handling (Should Handle Gracefully)

**Non-existent model:**
1. Search and try loading `fake-model-xyz`
2. Should show error toast
3. No crash
4. ✅ PASS: Error handled gracefully

**Server down:**
1. Kill Python server (Ctrl+C in Terminal 1)
2. Try loading a model in frontend
3. Toast: "Python model server not running!"
4. Instructions shown
5. ✅ PASS: Helpful error message

### Test 7: Parameter Controls (Should Disable)

1. ParameterControls panel disabled (greyed out) with text "Load a model to adjust"
2. Load gpt2
3. ParameterControls enabled and shows model name
4. Sliders responsive
5. Unload gpt2
6. ParameterControls disabled again
7. ✅ PASS: Disable state tied to active model

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| First load (gpt2) | ~2 min | Downloads 548MB, one-time |
| First load (bert) | ~1.5 min | Downloads 440MB, one-time |
| Subsequent load | <1 sec | From disk cache |
| Inference (gpt2) | ~5-10 sec | Depends on prompt length |
| Inference (bert) | ~2-5 sec | Varies by task |

## Troubleshooting

### "Internal Server Error" on Load
**Check:** Python server logs for model-specific errors
**Try:** Simpler model like `openai-community/gpt2`

### "Out of Memory" Error
**Cause:** Model too large for GPU
**Fix:** Use `cpu` mode or smaller model

### "Failed to fetch" on Inference
**Cause:** Server crashed or hung
**Action:** Restart server in Terminal 1

### Model loads but inference never completes
**Cause:** Server computing very slowly
**Fix:** Check GPU usage with `nvidia-smi`, CPU with `top`

### "Authentication required" for gated models
**Fix:** 
1. Get token: https://huggingface.co/settings/tokens
2. Accept license on model page
3. Set HF_TOKEN in `server/.env`
4. Restart server

## Success Criteria

✅ All 7 tests pass = FORGE is functional

## Next Steps

Once all tests pass:
1. Test with different model types (BERT, T5, etc.)
2. Load models on GPU and measure performance
3. Try gated models with HuggingFace token
4. Test production build: `npm run build`
5. Deploy to Vercel for cloud inference

## Support

Check logs:
- Frontend: Browser DevTools Console (F12)
- Backend: Terminal 1 where server runs
- Check `/server/README.md` for API details
