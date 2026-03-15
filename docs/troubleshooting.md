# Troubleshooting Guide

Common issues and solutions for FORGE setup and operation.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Model Loading Issues](#model-loading-issues)
- [Inference Issues](#inference-issues)
- [Performance Issues](#performance-issues)
- [Cache Issues](#cache-issues)
- [Network Issues](#network-issues)

## Installation Issues

### Node.js Version Incompatible

**Error:** `ERROR: Node.js version 16.x is not supported. Please use Node.js 18.x or higher.`

**Solution:**
```bash
# Check current version
node --version

# Install Node.js 18+ using nvm
nvm install 18
nvm use 18

# Or download from https://nodejs.org
```

### npm Install Fails

**Error:** `npm ERR! peer dep conflicts` or `npm ERR! network timeout`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Try installing again
npm install

# If still fails, try with legacy peer deps
npm install --legacy-peer-deps
```

### Python Dependencies Fail

**Error:** `ERROR: Could not install packages due to EnvironmentError`

**Solution:**
```bash
# Create virtual environment
python -m venv forge-env
source forge-env/bin/activate  # On Windows: forge-env\Scripts\activate

# Install in virtual environment
pip install -r requirements.txt

# If PyTorch fails, install separately
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Backend Issues

### Python Server Won't Start

**Error:** `Address already in use` or `Permission denied`

**Solution:**
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill the process using the port
kill -9 <PID>

# Or use different port
python model-server.py --port 5001
```

### CUDA Not Available

**Error:** `CUDA out of memory` or `CUDA not available`

**Solution:**
```bash
# Check CUDA installation
nvidia-smi

# Check PyTorch CUDA support
python -c "import torch; print(torch.cuda.is_available())"

# Force CPU mode in model-server.py
# Add this line at the top:
device = "cpu"
```

### Model Download Fails

**Error:** `Model not found on HuggingFace` or `Download timeout`

**Solution:**
```bash
# Check internet connection
curl -I https://huggingface.co

# Check HuggingFace Hub access
python -c "from huggingface_hub import hf_hub_download; print('Access OK')"

# Try different model
# Use smaller models like: distilbert-base-uncased, gpt2
```

### Backend Crashes on Model Load

**Error:** `RuntimeError: CUDA out of memory`

**Solution:**
```bash
# Reduce model size
# Use quantized models or smaller variants

# Force CPU inference
# Edit model-server.py and set device = "cpu"

# Clear GPU cache
python -c "import torch; torch.cuda.empty_cache()"
```

## Frontend Issues

### Dev Server Won't Start

**Error:** `Port 8080 is already in use`

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### TypeScript Compilation Errors

**Error:** `TypeScript compilation failed`

**Solution:**
```bash
# Check TypeScript version
npm list typescript

# Reinstall dependencies
rm -rf node_modules
npm install

# Check for type errors
npx tsc --noEmit
```

### White Screen or Blank Page

**Error:** Application loads but shows blank screen

**Solution:**
```bash
# Check browser console for errors
# Open Developer Tools → Console

# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Check if backend is running
curl http://localhost:5000/info
```

### Components Not Rendering

**Error:** React components not showing up

**Solution:**
```bash
# Check React Router configuration
# Verify routes in App.tsx

# Check for missing imports
# Ensure all components are properly imported

# Check console for React errors
# Look for "ReferenceError: Cannot access variable before initialization"
```

## Model Loading Issues

### Model Stuck at "Downloading"

**Error:** Model loading progress stuck at 0%

**Solution:**
```bash
# Check disk space
df -h

# Check network connection
ping huggingface.co

# Try smaller model first
# distilbert-base-uncased (268MB) instead of large models

# Check backend logs for errors
# Look for timeout or download errors
```

### Model Load Timeout

**Error:** "Model loading failed after timeout"

**Solution:**
```bash
# Increase timeout in model-loader.ts
# Find the timeout value and increase it

# Use faster internet connection
# Large models can take 10-30+ minutes on slow connections

# Pre-download model manually
python -c "from transformers import AutoModel; AutoModel.from_pretrained('model-name')"
```

### Model Loads But Shows Error

**Error:** Model appears loaded but inference fails

**Solution:**
```bash
# Check model compatibility
# Some models require specific tasks or formats

# Verify model task type
# Check if model supports text-generation

# Try different model
# Some models may be incompatible with current setup
```

## Inference Issues

### Inference Never Completes

**Error:** Generation hangs or takes very long

**Solution:**
```bash
# Reduce max_tokens parameter
# Try smaller values like 128 instead of 1024

# Lower temperature
# High temperature can cause longer generation

# Check backend resources
# Monitor CPU/GPU usage during inference

# Try simpler prompt
# Complex prompts may cause issues
```

### Poor Generation Quality

**Error:** Output is gibberish or irrelevant

**Solution:**
```bash
# Adjust parameters:
# - Lower temperature (0.1-0.3 for focused output)
# - Adjust top_p (0.8-0.9 for balanced output)
# - Increase max_tokens for longer responses

# Try different model
# Some models are better for specific tasks

# Check prompt format
# Some models require specific prompt formatting
```

### Streaming Not Working

**Error:** Output appears all at once instead of streaming

**Solution:**
```bash
# Check if streaming is enabled
# Verify stream parameter is true

# Check browser compatibility
# Some older browsers don't support streaming

# Check network conditions
# Slow connections can affect streaming

# Try non-streaming mode
# Some providers don't support streaming
```

## Performance Issues

### Slow Model Loading

**Issue:** Models take very long to load

**Solutions:**
```bash
# Use SSD storage for model cache
# Models load much faster from SSD

# Increase RAM if possible
# More RAM reduces swapping

# Use smaller models for testing
# Start with distilbert-base-uncased

# Pre-load common models
# Load models during setup, not during use
```

### High Memory Usage

**Issue:** Application uses too much RAM/VRAM

**Solutions:**
```bash
# Unload unused models
# Use cache management to remove models

# Reduce cache limit
# Lower storage limit in settings

# Use quantized models
# Look for models with "quantized" in name

# Restart application periodically
# Clear memory buildup over time
```

### Slow UI Response

**Issue:** Interface is laggy or unresponsive

**Solutions:**
```bash
# Close other browser tabs
# Free up system resources

# Check browser extensions
# Some extensions affect performance

# Try different browser
# Chrome vs Firefox performance varies

# Reduce telemetry update frequency
# Increase update interval in settings
```

## Cache Issues

### Cache Full Error

**Error:** "Cache storage limit exceeded"

**Solution:**
```bash
# Clear old models
# Use cache management to remove unused models

# Increase cache limit
# Adjust storage limit in settings

# Manually clear cache
# Use "Clear All" in cache management

# Prune old models
# Auto-prune models older than 7 days
```

### Cache Corruption

**Error:** "Cache data corrupted" or "Invalid cache format"

**Solution:**
```bash
# Clear entire cache
# Use "Clear All" in cache management

# Reset application data
# Clear localStorage in browser

# Restart application
# Fresh start often fixes corruption

# Check disk for errors
# Run disk check utility
```

### Models Not Persisting

**Issue:** Loaded models disappear after refresh

**Solution:**
```bash
# Check localStorage permissions
# Ensure browser allows localStorage

# Check cache settings
# Verify cache is enabled in settings

# Look for console errors
# Check for storage-related errors

# Try different browser
# Some browsers have stricter storage policies
```

## Network Issues

### Can't Connect to Backend

**Error:** "Failed to connect to Python server"

**Solution:**
```bash
# Verify backend is running
curl http://localhost:5000/info

# Check firewall settings
# Allow connections to localhost:5000

# Check CORS configuration
# Backend should allow frontend origin

# Try different port
# Change backend port if 5000 is blocked
```

### API Key Validation Fails

**Error:** "Invalid API key" for OpenAI/HuggingFace

**Solution:**
```bash
# Verify API key format
# Check for extra spaces or characters

# Test API key directly
curl -H "Authorization: Bearer YOUR_KEY" https://api.openai.com/v1/models

# Check account status
# Ensure account is active and has credits

# Regenerate API key
# Create new key from provider dashboard
```

### Rate Limiting

**Error:** "Rate limit exceeded" or "Too many requests"

**Solution:**
```bash
# Wait and retry
# Rate limits reset after time period

# Check usage limits
# Verify account tier and limits

# Use different provider
# Switch to alternative provider

# Reduce request frequency
# Add delays between requests
```

## Getting Help

### Debug Information

To get help effectively, collect this information:

```bash
# System information
node --version
npm --version
python --version
python -c "import torch; print(f'PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}')"

# Application logs
# Frontend: Browser console logs
# Backend: Terminal output from model-server.py

# Configuration
# .env.local file contents (remove API keys)
# model-server.py configuration
```

### Community Support

- **GitHub Issues**: [Report bugs](https://github.com/degenwithheart/Forge/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/degenwithheart/Forge/discussions)
- **Documentation**: [Complete docs](https://github.com/degenwithheart/Forge/docs)

### Reporting Issues

When reporting issues, include:

1. **Operating System** and version
2. **Browser** and version
3. **Node.js** and **Python** versions
4. **GPU** (if applicable)
5. **Error messages** (full text)
6. **Steps to reproduce**
7. **Expected vs actual behavior**

---

This troubleshooting guide covers the most common issues. For additional help, reach out to the community through the channels above.
