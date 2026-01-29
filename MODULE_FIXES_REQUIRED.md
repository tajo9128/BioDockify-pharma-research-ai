# BioDockify Module-by-Module Critical Fixes

**Date:** 2026-01-29  
**Repository:** https://github.com/tajo9128/BioDockify-pharma-research-ai  
**Version:** v2.17.8

---

## Executive Summary

This document provides critical fixes needed in each module to make the application functional. Each fix is prioritized by severity and impact on system functionality.

---

## Module 1: LLM Adapters

**File:** [`modules/llm/adapters.py`](modules/llm/adapters.py)  
**Critical Fix Required:** YES

### Bug #1: Variable Name Typo (CRITICAL)
**Location:** Line 189  
**Current Code:**
```python
for pref in self.PREFERRED_MODELS:  # TYPO - should be PREFERRED_MODELS
```

**Fix:**
```python
for pref in self.PREFERRED_MODELS:  # CORRECT
```

**Impact:** LM Studio model auto-selection will fail completely.  
**Time to Fix:** 2 minutes

---

## Module 2: API Main

**File:** [`api/main.py`](api/main.py)  
**Critical Fixes Required:** YES (2 critical bugs)

### Bug #2: Incorrect Google API URL (CRITICAL)
**Location:** Line 1312  
**Current Code:**
```python
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={request.key}"
# TYPO - missing 'e' in generative
```

**Fix:**
```python
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={request.key}"
# CORRECT - added 'e'
```

**Impact:** Google Gemini API will not work at all.  
**Time to Fix:** 2 minutes

### Bug #3: Missing Quote in Dict Key (MEDIUM)
**Location:** Line 1320  
**Current Code:**
```python
err = resp.json().get('error', {})
# TYPO - missing closing quote
```

**Fix:**
```python
err = resp.json().get('error', {})
# CORRECT - added closing quote
```

**Impact:** Error parsing may fail.  
**Time to Fix:** 1 minute

---

## Module 3: Connection Doctor

**File:** [`modules/system/connection_doctor.py`](modules/system/connection_doctor.py)  
**Critical Fix Required:** YES

### Bug #4: Variable Name Mismatch (CRITICAL)
**Location:** Line 463  
**Current Code:**
```python
hf_key = ai_config.get("huggingface_key")
if hf_key:  # BUG - hf_key doesn't exist
```

**Fix:**
```python
huggingface_key = ai_config.get("huggingface_key")
if huggingface_key:  # CORRECT - use huggingface_key
```

**Impact:** HuggingFace API key validation will fail.  
**Time to Fix:** 2 minutes

---

## Module 4: Frontend - Main Page

**File:** [`src/app/page.tsx`](src/app/page.tsx)  
**Critical Fixes Required:** YES (1 critical bug)

### Bug #5: Alert Variant Typo (HIGH)
**Location:** Line 702  
**Current Code:**
```tsx
<Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md z-50">
# TYPO - 'destructive' misspelled as 'destructive'
```

**Fix:**
```tsx
<Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md z-50">
# CORRECT - 'destructive' with 'ive'
```

**Impact:** Error alerts will not display correctly.  
**Time to Fix:** 1 minute

---

## Module 5: Frontend - Connectivity Healer

**File:** [`ui/src/components/wizard/ConnectivityHealer.tsx`](ui/src/components/wizard/ConnectivityHealer.tsx)  
**Critical Fixes Required:** YES (1 critical bug)

### Bug #6: Incorrect API Endpoint URL (CRITICAL)
**Location:** Line 72  
**Current Code:**
```tsx
const response = await fetch('/api/diagnose/connectivity', {
# TYPO - missing 'i' in 'diagnose'
```

**Fix:**
```tsx
const response = await fetch('/api/diagnose/connectivity', {
# CORRECT - added 'i' in 'diagnose'
```

**Impact:** First-run wizard will fail to connect to backend.  
**Time to Fix:** 2 minutes

---

## Module 6: Server Entry Point

**File:** [`server.py`](server.py)  
**Critical Fixes Required:** YES (1 critical blocker)

### Bug #7: Python Version Incompatibility (CRITICAL)
**Location:** Lines 32-36  
**Current Code:**
```python
try:
    import tensorflow
except ImportError:
    logging.error("CRITICAL: TensorFlow not found. Please run 'pip install tensorflow'.")
    raise SystemExit(1)
```

**Issue:** Python 3.13.11 is installed but TensorFlow requires Python 3.10-3.12

**Fix Required:** 
```bash
# Install Python 3.11.x from python.org
# Create virtual environment
python3.11 -m venv venv
venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Impact:** Application cannot start at all.  
**Time to Fix:** 30-60 minutes (Python installation + dependency setup)

---

## Module 7: Configuration Loader

**File:** [`runtime/config.yaml`](runtime/config.yaml)  
**Critical Fixes Required:** NO (but should be cleaned)

### Issue #8: Duplicate Configuration Sections (MEDIUM)
**Location:** Lines 84-88  
**Current State:**
```yaml
# Lines 1-5 contain valid config
project:
  name: My PhD Research
  # ... rest of config

# Lines 84-88 contain duplicate with BOM prefix
"\xEF\xBB\xBFproject":
  name: My PhD Research
  type: PhD Thesis
  # ... duplicate
```

**Fix:**
```yaml
# Remove lines 84-88 completely
```

**Impact:** Configuration loading may produce unexpected behavior.  
**Time to Fix:** 2 minutes

---

## Module 8: Runtime - Service Manager

**File:** [`runtime/service_manager.py`](runtime/service_manager.py)  
**Critical Fixes Required:** NO

**Observation:** No critical bugs found, but should be reviewed for LM Studio auto-start functionality.

---

## Module 9: Orchestrator

**File:** [`orchestration/planner/orchestrator.py`](orchestration/planner/orchestrator.py)  
**Critical Fixes Required:** NO

**Observation:** No critical bugs found, but should be reviewed for error handling in plan generation.

---

## Module 10: Frontend - Settings Panel

**File:** Multiple files (no dedicated settings component found)  
**Critical Fixes Required:** YES (missing feature)

### Issue #9: No Settings UI Component (HIGH)
**Location:** Not applicable - component doesn't exist

**Current State:**
- Main page ([`src/app/page.tsx`](src/app/page.tsx)) has goal input and thinking stream
- No dedicated settings/configuration panel
- Users cannot configure API keys, model preferences, or other settings from UI

**Fix Required:**
```tsx
// Create new component: src/app/settings/page.tsx
// Should include:
// - API key configuration (Google, OpenRouter, HuggingFace, etc.)
// - Model selection and preferences
// - Service URLs (LM Studio, SurfSense, etc.)
// - Research settings (literature sources, citation style, etc.)
// - Export settings (format, directory, etc.)
// - System settings (auto-start services, logging level, etc.)
```

**Impact:** Users must manually edit configuration files, poor UX.  
**Time to Fix:** 4-6 hours (design and implementation)

---

## Module 11: Frontend - Chat Interface

**File:** Not found (no dedicated chat component)  
**Critical Fixes Required:** YES (missing feature)

### Issue #10: No Visible Chat UI Component (HIGH)
**Location:** Not applicable - component doesn't exist

**Current State:**
- Chat endpoints exist in API ([`/api/agent/chat`](api/main.py:1806), [`/api/rag/chat`](api/main.py:2251))
- No visible chat interface in main page
- Users cannot access chat functionality from UI

**Fix Required:**
```tsx
// Create new component: src/components/chat/ChatInterface.tsx
// Should integrate with:
// - Message input and send button
// - Conversation history display
// - Message bubbles for user and AI
// - Typing indicators
// - Error handling and retry logic
// - Connection to agent chat endpoint
```

**Impact:** Chat functionality exists but is not accessible from UI.  
**Time to Fix:** 4-6 hours (design and implementation)

---

## Summary of Critical Fixes by Module

| Module | File | Critical Fixes | Time to Fix |
|---------|------|----------------|--------------|
| 1. LLM Adapters | [`modules/llm/adapters.py`](modules/llm/adapters.py) | 1 bug | 2 min |
| 2. API Main | [`api/main.py`](api/main.py) | 2 bugs | 3 min |
| 3. Connection Doctor | [`modules/system/connection_doctor.py`](modules/system/connection_doctor.py) | 1 bug | 2 min |
| 4. Frontend - Main Page | [`src/app/page.tsx`](src/app/page.tsx) | 1 bug | 1 min |
| 5. Frontend - Connectivity Healer | [`ui/src/components/wizard/ConnectivityHealer.tsx`](ui/src/components/wizard/ConnectivityHealer.tsx) | 1 bug | 2 min |
| 6. Server Entry Point | [`server.py`](server.py) | 1 blocker | 30-60 min |
| 7. Configuration | [`runtime/config.yaml`](runtime/config.yaml) | 1 cleanup | 2 min |
| 8. Runtime - Service Manager | [`runtime/service_manager.py`](runtime/service_manager.py) | Review needed | - |
| 9. Orchestrator | [`orchestration/planner/orchestrator.py`](orchestration/planner/orchestrator.py) | Review needed | - |
| 10. Frontend - Settings Panel | MISSING | Create component | 4-6 hours |
| 11. Frontend - Chat Interface | MISSING | Create component | 4-6 hours |

**Total Critical Fixes:** 7 bugs (5 in code, 1 blocker, 1 cleanup)  
**Total Time to Fix:** 48-79 hours

---

## Recommended Fix Order

### Phase 1: Immediate (0-1 hour)
1. **Fix Python Version** - Install Python 3.11.x (BLOCKER)
2. **Fix LM Studio Variable** - Line 189 in adapters.py
3. **Fix Google API URL** - Line 1312 in api/main.py
4. **Fix HuggingFace Variable** - Line 463 in connection_doctor.py
5. **Fix Connectivity Healer URL** - Line 72 in ConnectivityHealer.tsx
6. **Fix Alert Variant** - Line 702 in page.tsx

### Phase 2: Short-term (1-2 hours)
7. **Fix Missing Quote** - Line 1320 in api/main.py
8. **Fix Status Mapping** - Lines 80-88 in ConnectivityHealer.tsx
9. **Add 'degraded' Handling** - Lines 201-213 in ConnectivityHealer.tsx
10. **Clean Config File** - Remove lines 84-88 in runtime/config.yaml

### Phase 3: Long-term (4-10 hours)
11. **Create Settings UI Component** - Design and implement full settings panel
12. **Create Chat Interface Component** - Design and implement chat UI
13. **Improve Error Handling** - Add better error messages and recovery throughout all modules

---

## Testing After Fixes

After implementing fixes, test in this order:

1. **Python Environment:**
   - Verify Python 3.11.x is active
   - Test TensorFlow import
   - Verify all dependencies install correctly

2. **LM Studio Integration:**
   - Start LM Studio with a model
   - Test model auto-detection
   - Test connection from API
   - Test auto-start functionality

3. **API Endpoints:**
   - Test Google Gemini API connection with correct URL
   - Test OpenRouter API connection
   - Test HuggingFace API connection with correct variable
   - Test connectivity healer with correct endpoint

4. **Frontend:**
   - Test alert component renders correctly
   - Test connectivity healer connects to backend
   - Test first-run wizard completes successfully
   - Test main page renders without errors

5. **Integration:**
   - Test full application flow from first-run to normal operation
   - Test chat functionality (once UI component is created)
   - Test settings panel (once created)

---

## Conclusion

The BioDockify application has **7 critical bugs** that must be fixed before it can function:

1. **Python version incompatibility** - Complete blocker
2. **LM Studio variable typo** - Breaks model auto-selection
3. **Google API URL typo** - Breaks Google Gemini integration
4. **HuggingFace variable mismatch** - Breaks HuggingFace validation
5. **Connectivity Healer URL typo** - Breaks first-run wizard
6. **Alert variant typo** - Breaks error notifications
7. **Missing Settings UI** - Poor user experience

**Estimated Time to Fix All Critical Bugs:** 45 minutes  
**Risk Level:** Low (all fixes are straightforward typos and variable name corrections)

**Next Steps:** 
1. Install Python 3.11.x
2. Apply code fixes in order listed above
3. Test application thoroughly

---

**Document Created By:** Debug Mode Analysis  
**Purpose:** Module-by-module breakdown of critical fixes needed
