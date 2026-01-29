# BioDockify Setup Guide - Python 3.13 Compatibility Fix

## ❌ The Problem

You have **Python 3.13** installed, but BioDockify requires **Python 3.10-3.12** due to TensorFlow compatibility.

```
ImportError: DLL load failed while importing _pywrap_tensorflow_internal
```

## ✅ The Solution

### Option 1: Install Python 3.11 (Recommended)

1. **Download Python 3.11.x** from: https://www.python.org/downloads/release/python-3119/

2. **Create a virtual environment with Python 3.11:**
   ```powershell
   # Windows (if you have multiple Python versions)
   py -3.11 -m venv .venv
   
   # Activate it
   .venv\Scripts\activate
   ```

3. **Verify Python version:**
   ```powershell
   python --version
   # Should show: Python 3.11.x
   ```

4. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Install Playwright browsers:**
   ```powershell
   playwright install chromium
   ```

### Option 2: Use pyenv-win (Advanced)

```powershell
# Install pyenv-win
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"; &"./install-pyenv-win.ps1"

# Restart terminal, then:
pyenv install 3.11.9
pyenv local 3.11.9
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 🔍 Verify Your Setup

Run the environment check script:

```powershell
python check_environment.py
```

You should see:
```
✅ PASS: Python 3.11 is compatible!
✅ Environment looks good!
```

## 🚀 Start BioDockify

After fixing Python version:

```powershell
# Terminal 1: Start Backend
python -m api.main

# Terminal 2: Start Frontend
cd ui
npm run dev
```

## 📋 Version Requirements Summary

| Package | Required | Reason |
|---------|----------|--------|
| Python | 3.10-3.12 | TensorFlow 2.15 compatibility |
| TensorFlow | 2.15.x | DECIMER molecular vision |
| NumPy | <2.0.0 | TensorFlow compatibility |
| OpenCV | <4.11.0 | Stability |

## ⚠️ Common Mistakes

1. **Don't use global Python 3.13** - Always use a venv with 3.11
2. **Don't upgrade NumPy to 2.x** - It breaks TensorFlow
3. **Don't upgrade TensorFlow past 2.15** - It requires Python 3.13+

## 📞 Still Having Issues?

Check the full debugging report: `DEBUGGING_REPORT.md`
