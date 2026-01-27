# Release Notes - BioDockify v2.17.2

**Release Date**: January 27, 2026

## 🎉 What's New

### ✨ Omni Tools - Fully Functional
Complete implementation of the Omni Tools module with comprehensive functionality:
- **PDF Tools**: Merge multiple PDFs, split with page range support
- **Image Tools**: Convert formats, resize, compress
- **Data Processing**: CSV/JSON/Excel conversion and profiling  
- **Text Utilities**: Case transforms, reverse, shuffle, word/char count
- **Math Tools**: Safe expression calculator, prime number generator

**Status**: 9/9 unit tests passing ✅

### 🔧 API Connection Fixes

#### LM Studio Connection Test
- Fixed URL handling bug where test incorrectly appended `/models` to URLs already containing the path
- Properly extracts base URL for chat completions endpoint
- Connection test now works reliably with `http://localhost:1234/v1/models`

#### DeepSeek API Support  
- Updated Custom API placeholder to show correct format: `https://api.deepseek.com/v1`
- Added helper text explaining `/v1` path requirement for OpenAI-compatible APIs
- Improved error messaging for connection failures

### 🎨 Consolidated Paid API UI
**Major UX Improvement**: Replaced separate API provider sections with unified dropdown

**Before**: 5 separate sections (DeepSeek, GLM, KIMI, OpenAI, Custom)  
**After**: Single dropdown with 6 providers

**New Features**:
- 🚀 **DeepSeek** - Powerful reasoning models
- 🇨🇳 **GLM/ZhipuAI** - Multilingual support
- 🌙 **KIMI/Moonshot** - 200k token context
- 🤖 **OpenAI** - Industry-leading models  
- ⚡ **Groq** - Ultra-fast inference
- 🔧 **Custom** - Any OpenAI-compatible API

**Benefits**:
- Auto-fills base URLs when provider selected
- Dynamic model placeholders per provider
- Context-aware hints and tips
- Cleaner, more intuitive interface
- Reduced UI clutter (65 lines → 59 lines)

## 🐛 Bug Fixes
- Fixed LM Studio connection test URL path handling
- Improved custom API validation and error messages

## 📦 Updated Dependencies
All dependencies current as of release date

## 🔗 Links
- [GitHub Repository](https://github.com/tajo9128/BioDockify-pharma-research-ai)
- [Documentation](https://github.com/tajo9128/BioDockify-pharma-research-ai#readme)

---

**Full Changelog**: v2.17.1...v2.17.2
