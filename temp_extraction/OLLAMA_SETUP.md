# Ollama Integration Guide

This guide explains how to set up and use Ollama as a local LLM provider for PharmaResearch AI.

## 📋 What is Ollama?

Ollama is a tool for running large language models (LLMs) locally on your computer. It provides:
- ✅ Complete privacy - data never leaves your computer
- ✅ Offline capability - works without internet
- ✅ No API costs - once downloaded, free to use
- ✅ Multiple models - support for Llama 2, Mistral, and more

## 🚀 Quick Start

### 1. Install Ollama

#### macOS
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Windows
Download installer from: https://ollama.com/download

### 2. Start Ollama Service

Ollama should start automatically after installation. Verify it's running:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags
```

If you see a JSON response, Ollama is running!

### 3. Download a Model

```bash
# Download Llama 2 (recommended, ~4GB)
ollama pull llama2

# Or download Mistral (lighter, ~4GB)
ollama pull mistral

# Or download a smaller model for faster inference
ollama pull llama2:7b-chat-q4_K_M  # ~4GB
ollama pull llama2:13b-chat-q4_K_M # ~7.5GB
```

### 4. Verify Installation

```bash
# List available models
ollama list

# Test the model
echo "What is pharmaceutical research?" | ollama run llama2
```

## 🔧 Configuration

### Default Configuration

PharmaResearch AI uses these defaults:
- **Ollama URL**: `http://localhost:11434`
- **Default Model**: `llama2`
- **Timeout**: 120 seconds

### Custom Configuration

You can change the Ollama URL in the Settings page:
1. Go to Settings → AI Provider Settings
2. Enter your custom Ollama URL
3. Click "Save"

Environment variable:
```bash
export OLLAMA_BASE_URL="http://custom-host:custom-port"
```

## 🎯 Recommended Models

### For General Use (Recommended)
| Model | Size | RAM | Speed | Quality |
|-------|------|-----|-------|---------|
| llama2 | 7B | 8GB | Fast | Good |
| llama2:13b | 13B | 16GB | Medium | Very Good |
| mistral | 7B | 8GB | Fast | Good |

### For Resource-Constrained Systems
| Model | Size | RAM | Speed | Quality |
|-------|------|-----|-------|---------|
| llama2:7b-chat-q4_K_M | ~4GB | 6GB | Very Fast | Good |
| phi | 3.8B | 4GB | Very Fast | Decent |

### For Maximum Quality
| Model | Size | RAM | Speed | Quality |
|-------|------|-----|-------|---------|
| llama2:70b | 70B | 64GB | Slow | Excellent |
| mixtral | 8x7B | 48GB | Medium | Excellent |

## 🎛️ Advanced Usage

### Running Multiple Models

```bash
# Start different models on different ports
OLLAMA_HOST=127.0.0.1:11434 ollama serve &
OLLAMA_HOST=127.0.0.1:11435 ollama serve &
```

### Model-Specific Settings

Update the default model in Settings or via environment:

```bash
# Set custom model for Ollama provider
export OLLAMA_DEFAULT_MODEL="mistral"
```

### Performance Tuning

For better performance:

1. **GPU Acceleration** (if available):
   - Ollama automatically uses GPU if detected
   - Verify with: `ollama list` (shows GPU status)

2. **Reduce Context Length**:
   - Smaller models are faster
   - Use quantized models (q4, q5, q8)

3. **System Requirements**:
   - **Minimum**: 8GB RAM, 10GB disk space
   - **Recommended**: 16GB RAM, 20GB disk space
   - **With GPU**: 8GB VRAM

## 🔌 API Usage

### Manual API Testing

```bash
# Get available models
curl http://localhost:11434/api/tags

# Generate completion
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "What is pharmaceutical research?",
  "stream": false
}'

# Chat completion
curl http://localhost:11434/api/chat -d '{
  "model": "llama2",
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}'
```

## 🔍 Troubleshooting

### Issue: "Ollama not available"
**Solutions:**
1. Check if Ollama is running: `curl http://localhost:11434/api/tags`
2. Start Ollama: `ollama serve`
3. Check firewall settings
4. Verify correct URL in Settings

### Issue: "Timeout error"
**Solutions:**
1. Use a smaller model
2. Increase timeout in Settings
3. Close other applications to free RAM
4. Use GPU-accelerated model

### Issue: "Slow response"
**Solutions:**
1. Use quantized model (q4 instead of q8)
2. Reduce context length
3. Use smaller model (7B instead of 13B)
4. Enable GPU acceleration

### Issue: "Out of memory"
**Solutions:**
1. Use smaller model
2. Close other applications
3. Increase system swap space
4. Use model with lower quantization

## 📊 Model Comparison

### Llama 2 vs Mistral

| Feature | Llama 2 | Mistral |
|---------|----------|---------|
| Size | 7B / 13B / 70B | 7B |
| Context | 4096 / 8192 | 8192 |
| Speed | Medium | Fast |
| Quality | High | Very High |
| Best For | General purpose | Reasoning |

### When to Use Each Model

**Use Llama 2 for:**
- General pharmaceutical research
- Standard text generation
- Balanced speed/quality

**Use Mistral for:**
- Complex reasoning tasks
- Detailed analysis
- When you want faster responses

## 🔒 Privacy & Security

### Data Privacy with Ollama
- ✅ **All data stays local** - Nothing leaves your machine
- ✅ **No internet required** - Works completely offline
- ✅ **No API keys** - No authentication needed
- ✅ **No tracking** - Open source, transparent

### Security Best Practices
1. Only run Ollama on trusted networks
2. Keep your system updated
3. Use official Ollama releases only
4. Regularly update models
5. Monitor system resource usage

## 📚 Additional Resources

### Official Documentation
- Ollama GitHub: https://github.com/ollama/ollama
- Ollama Website: https://ollama.com
- Model Library: https://ollama.com/library

### PharmaResearch AI Integration
- Settings page to configure Ollama
- Auto-detection of Ollama availability
- Automatic fallback to cloud if Ollama unavailable

## 🆘 Getting Help

If you encounter issues with Ollama:

1. Check Ollama logs: `tail -f ~/.ollama/logs/server.log`
2. Verify model installation: `ollama list`
3. Check system resources: `htop` (Linux) or `Activity Monitor` (macOS)
4. Review this guide's troubleshooting section

## ✅ Setup Checklist

- [ ] Install Ollama
- [ ] Start Ollama service
- [ ] Download a model (llama2 or mistral)
- [ ] Verify Ollama is running (curl test)
- [ ] Configure Ollama URL in PharmaResearch AI Settings
- [ ] Set preferred provider to "Ollama" or "Auto"
- [ ] Test with a research task

---

**Ready to start?** Run your first research task with Ollama local AI! 🚀
