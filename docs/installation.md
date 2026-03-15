# Installation Guide

Complete setup instructions for FORGE's frontend and backend components.

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Python**: 3.8 or higher
- **RAM**: 8GB (16GB+ recommended for larger models)
- **Storage**: 10GB free space (50GB+ for multiple models)

### Optional Requirements
- **GPU**: NVIDIA GPU with CUDA support (for local model acceleration)
- **VRAM**: 8GB+ (for larger models like Llama-7B)
- **Internet**: Required for initial model downloads

## Frontend Installation

### 1. Clone Repository
```bash
git clone https://github.com/degenwithheart/Forge.git
cd hugging-hub-local
```

### 2. Install Frontend Dependencies
```bash
cd src
npm install
```

### 3. Environment Configuration
Create `.env.local` in the `src` directory:
```bash
# Optional: Override default settings
VITE_API_BASE_URL=http://localhost:5000
VITE_DEFAULT_CACHE_LIMIT_MB=500
VITE_TELEMETRY_UPDATE_INTERVAL=500
```

### 4. Verify Frontend Setup
```bash
npm run dev
```
The frontend should start at http://localhost:8080

## Backend Installation

### 1. Install Python Dependencies
```bash
cd server
pip install -r requirements.txt
```

### 2. Verify Python Environment
```bash
python --version  # Should be 3.8+
pip list | grep torch  # Verify PyTorch installation
```

### 3. GPU Setup (Optional but Recommended)

#### NVIDIA GPU Setup
```bash
# Verify CUDA installation
nvidia-smi

# Install CUDA-enabled PyTorch (if not already installed)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### CPU-Only Setup
If no GPU is available, the system will automatically fall back to CPU inference:
```bash
# No additional setup needed - models will run on CPU
```

### 4. Start Backend Server
```bash
python model-server.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:5000
INFO:     Application startup complete
INFO:     Device: cuda:0 (NVIDIA RTX 3080) or cpu
```

## Complete Setup Verification

### 1. Start Both Services
```bash
# Terminal 1: Backend
cd server
python model-server.py

# Terminal 2: Frontend
cd src
npm run dev
```

### 2. Access the Application
Open http://localhost:8080 in your browser

### 3. Test Basic Functionality

#### Test Backend Connection
1. Open browser developer tools
2. Check Network tab for successful requests to localhost:5000
3. Look for `/info` endpoint call

#### Test Model Loading
1. Click on "Text" modality tab
2. Search for "distilbert-base-uncased"
3. Click "Load" button
4. Watch for success notifications

#### Test Inference
1. Once model is loaded, enter a test prompt
2. Click "Run" or press Ctrl+Enter
3. Verify streaming output appears

## Configuration Options

### Frontend Configuration
Edit `src/.env.local` for custom settings:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_OPENAI_BASE_URL=https://api.openai.com
VITE_HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co

# Cache Configuration
VITE_DEFAULT_CACHE_LIMIT_MB=500
VITE_CACHE_PRUNE_DAYS=7
VITE_QUERY_CACHE_MINUTES=5

# Telemetry Configuration
VITE_TELEMETRY_UPDATE_INTERVAL=500
VITE_ENABLE_HARDWARE_TELEMETRY=true

# UI Configuration
VITE_DEFAULT_TEMPERATURE=0.7
VITE_DEFAULT_TOP_P=0.9
VITE_DEFAULT_MAX_TOKENS=256
VITE_DEFAULT_CONTEXT_WINDOW=4096
```

### Backend Configuration
Edit `server/model-server.py` for advanced settings:

```python
# Device Configuration
device = "auto"  # "auto", "cuda", "cpu", or specific GPU ID

# Model Configuration
DEFAULT_MODEL_CACHE_DIR = "./models"
MAX_LOADED_MODELS = 3
MODEL_UNLOAD_TIMEOUT = 30

# Server Configuration
HOST = "0.0.0.0"
PORT = 5000
WORKERS = 1
```

## Troubleshooting

### Common Issues

#### Frontend Issues

**Error: "npm install fails"**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Error: "Vite dev server won't start"**
```bash
# Check port availability
lsof -i :8080
# Kill process if needed
kill -9 <PID>

# Try different port
npm run dev -- --port 3000
```

**Error: "TypeScript compilation errors"**
```bash
# Check TypeScript version
npm list typescript

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Backend Issues

**Error: "Python module not found"**
```bash
# Reinstall Python dependencies
pip install -r requirements.txt --force-reinstall

# Check Python path
which python
python --version
```

**Error: "CUDA out of memory"**
```bash
# Force CPU mode in model-server.py
device = "cpu"

# Or reduce model size
# Use smaller models like distilbert instead of large Llama models
```

**Error: "Model download fails"**
```bash
# Check internet connection
curl -I https://huggingface.co

# Verify disk space
df -h

# Check HuggingFace access
python -c "from huggingface_hub import hf_hub_download; print('Access OK')"
```

#### Connection Issues

**Error: "Frontend can't connect to backend"**
```bash
# Verify backend is running
curl http://localhost:5000/info

# Check firewall settings
# Allow connections to localhost:5000

# Verify CORS configuration
# Backend should allow http://localhost:8080
```

### Performance Optimization

#### Frontend Performance
```bash
# Enable build optimization
npm run build

# Enable source maps for debugging
npm run build:dev

# Analyze bundle size
npm run build -- --analyze
```

#### Backend Performance
```bash
# Enable GPU acceleration
# Ensure CUDA drivers are installed
nvidia-smi

# Optimize model loading
# Use quantized models when available
# Pre-download frequently used models
```

## Next Steps

After successful installation:

1. [**Quick Start Guide**](quick-start.md) - 5-minute first run
2. [**User Guides**](guides/) - Detailed feature usage
3. [**API Reference**](api-reference.md) - Complete API documentation
4. [**Troubleshooting**](troubleshooting.md) - Common issues

## Help & Support

- **GitHub Issues**: [Report bugs](https://github.com/degenwithheart/Forge/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/degenwithheart/Forge/discussions)
- **Documentation**: [Complete docs](https://github.com/degenwithheart/Forge/docs)

---

Installation complete! Welcome to FORGE - your local AI intelligence platform.
