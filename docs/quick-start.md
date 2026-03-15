# Quick Start Guide

Get FORGE running in 5 minutes with this step-by-step guide.

## Prerequisites Check

Ensure you have:
- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed
- [ ] 8GB+ RAM (16GB+ recommended)
- [ ] Internet connection for model downloads

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/degenwithheart/Forge.git
cd hugging-hub-local

# Install frontend dependencies
cd src
npm install

# Install backend dependencies
cd ../server
pip install -r requirements.txt
```

## Step 2: Start Services

```bash
# Terminal 1: Start Python backend
cd server
python model-server.py
# You should see: "Uvicorn running on http://0.0.0.0:5000"

# Terminal 2: Start frontend
cd src
npm run dev
# You should see: "Local: http://localhost:8080"
```

## Step 3: Open Application

Navigate to **http://localhost:8080** in your browser.

You should see the FORGE interface with:
- Left panel: Model library
- Center area: Prompt input and output
- Right panel: Telemetry and controls

## Step 4: Load Your First Model

### For Testing: Use a Small Model

1. **Select Text Modality**
   - Click the "TXT" tab at the top of the model library

2. **Search for a Model**
   - In the search box, type: `distilbert-base-uncased`
   - Press Enter or click the search icon

3. **Load the Model**
   - Click the "Load" button on the model card
   - Watch for notifications:
     - "📥 Loading distilbert-base-uncased..."
     - "✅ distilbert-base-uncased ready!"

### Expected Loading Time
- **First time**: 2-5 minutes (downloading model)
- **Subsequent loads**: 5-10 seconds (from cache)

## Step 5: Run Your First Inference

1. **Enter a Prompt**
   - In the center panel, type: `What is artificial intelligence?`

2. **Run Inference**
   - Click the "Run" button or press `Ctrl+Enter`
   - Watch the streaming output appear in real-time

3. **Observe Telemetry**
   - Right panel shows live metrics:
     - TPS (tokens per second)
     - VRAM/CPU usage
     - Generation time

## Step 6: Experiment with Parameters

1. **Open Parameter Controls**
   - In the right panel, adjust the temperature slider
   - Try values from 0.1 (focused) to 1.5 (creative)

2. **Test Different Settings**
   - **Temperature 0.1**: More predictable, factual responses
   - **Temperature 1.0**: Balanced creativity
   - **Temperature 1.5**: More creative, varied responses

3. **Compare Results**
   - Run the same prompt with different temperatures
   - Notice how output changes

## Step 7: Try Mobile View

1. **Resize Browser**
   - Make browser window narrow (< 768px)
   - Interface automatically switches to mobile layout

2. **Explore Mobile Features**
   - Swipe up from bottom for telemetry
   - Tap view buttons to switch between:
     - Out (output stream)
     - Lib (model library)
     - Prm (parameters)
     - Dsk (cache management)
     - Api (provider settings)

## Step 8: Test Cache Management

1. **View Cache Statistics**
   - Go to mobile view and tap "Dsk"
   - Or on desktop, observe the cache panel

2. **See Model Information**
   - Model name and size
   - Last used timestamp
   - Access count

3. **Test Cache Operations**
   - Try removing a model from cache
   - Observe storage space changes

## Common First-Time Issues

### Issue: "Python model server not running"
**Solution**: Make sure the backend is running in separate terminal:
```bash
cd server
python model-server.py
```

### Issue: "Model loading takes forever"
**Solution**: This is normal for first-time downloads. Models are large (100MB-10GB).

### Issue: "No models appear in search"
**Solution**: Check internet connection and try searching for common models like:
- `distilbert-base-uncased`
- `gpt2`
- `bert-base-uncased`

### Issue: "Inference fails with error"
**Solution**: 
1. Ensure model is fully loaded
2. Check backend terminal for error messages
3. Try a simpler prompt

## Next Steps

Congratulations! You've successfully:
- ✅ Started FORGE frontend and backend
- ✅ Loaded your first model
- ✅ Run inference with streaming output
- ✅ Experimented with parameters
- ✅ Tested mobile interface
- ✅ Explored cache management

### Continue Your Journey

1. **[Load Larger Models](guides/model-loading.md)** - Try Llama, Mistral, or Qwen
2. **[Set Up API Keys](guides/provider-setup.md)** - Add OpenAI or HuggingFace API
3. **[Advanced Parameters](guides/parameter-tuning.md)** - Master inference controls
4. **[Benchmark Performance](guides/benchmarking.md)** - Compare model performance
5. **[Mobile Usage](guides/mobile-usage.md)** - Optimize mobile experience

### Pro Tips

- **Keyboard Shortcuts**: `Ctrl+Enter` to run inference, `Escape` to cancel
- **Model Persistence**: Loaded models survive page refreshes
- **Cache Management**: Models auto-prune after 7 days
- **Provider Fallback**: Try local first, then API providers

---

Welcome to FORGE! You're now ready to explore the world of AI model testing and development.
