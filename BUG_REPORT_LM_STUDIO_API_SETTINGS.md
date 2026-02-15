# BioDockify Bug Report: LM Studio, API, and Settings Panel

**Date:** 2026-01-29  
**Repository:** https://github.com/tajo9128/BioDockify-pharma-research-ai  
**Version:** 2.16.4 - 2.17.7

---

## Executive Summary

I have identified **7 bugs** across LM Studio integration, API endpoints, and Settings panel. These bugs range from typos to incorrect API URLs that will prevent the application from functioning correctly.

---

## Critical Bugs (Must Fix)

### 1. LM Studio Adapter - Typo in Variable Name ⚠️ **CRITICAL**

**File:** [`modules/llm/adapters.py`](modules/llm/adapters.py:189)  
**Line:** 189  
**Severity:** CRITICAL - Will cause runtime error

**Bug:**
```python
# Line 189 - TYPO: PREFERRED_MODELS is misspelled as PREFERRED_MODELS
for pref in self.PREFERRED_MODELS:  # Should be self.PREFERRED_MODELS
```

**Issue:** The variable `self.PREFERRED_MODELS` is referenced but the class attribute is defined as `PREFERRED_MODELS` (line 146). This will cause an `AttributeError` at runtime when trying to auto-select a model.

**Impact:** LM Studio model auto-selection will fail completely, breaking the entire LM Studio integration.

**Fix:**
```python
# Change line 189 from:
for pref in self.PREFERRED_MODELS:

# To:
for pref in self.PREFERRED_MODELS:
```

---

### 2. API Endpoint - Incorrect Google API URL ⚠️ **CRITICAL**

**File:** [`api/main.py`](api/main.py:1312)  
**Line:** 1312  
**Severity:** CRITICAL - Will cause API connection failure

**Bug:**
```python
# Line 1312 - TYPO: Missing 'e' in 'generative'
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={request.key}"
```

**Issue:** The URL is misspelled as `generativelanguage` instead of `generativelanguage`. This will cause all Google Gemini API calls to fail with a DNS/host not found error.

**Impact:** Google Gemini API will be completely non-functional.

**Fix:**
```python
# Change line 1312 from:
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={request.key}"

# To:
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={request.key}"
```

---

### 3. Connection Doctor - Variable Name Mismatch ⚠️ **CRITICAL**

**File:** [`modules/system/connection_doctor.py`](modules/system/connection_doctor.py:463)  
**Line:** 463  
**Severity:** CRITICAL - Will cause runtime error

**Bug:**
```python
# Line 462-463 - Variable name mismatch
hf_key = ai_config.get("huggingface_key")
if hf_key:  # hf_key is undefined, should be huggingface_key
```

**Issue:** The variable `huggingface_key` is assigned on line 462, but line 463 checks for `hf_key` which doesn't exist. This will cause a `NameError` at runtime.

**Impact:** HuggingFace API key validation will fail completely.

**Fix:**
```python
# Change line 463 from:
if hf_key:

# To:
if huggingface_key:
```

---

## High Priority Bugs

### 4. Settings Panel - Incorrect Alert Variant ⚠️ **HIGH**

**File:** [`src/app/page.tsx`](src/app/page.tsx:702)  
**Line:** 702  
**Severity:** HIGH - Will cause UI error

**Bug:**
```tsx
// Line 702 - TYPO: 'destructive' is misspelled as 'destructive'
<Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md z-50">
```

**Issue:** The variant prop is misspelled. The correct value should be `destructive` (with 'ive' at the end). This will cause the Alert component to render incorrectly or throw an error.

**Impact:** Error alerts will not display correctly, breaking the error notification system.

**Fix:**
```tsx
// Change line 702 from:
<Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md z-50">

// To:
<Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md z-50">
```

---

### 5. Settings Panel - Poor User Experience with Alert ⚠️ **HIGH**

**File:** [`src/app/page.tsx`](src/app/page.tsx:367)  
**Line:** 367  
**Severity:** HIGH - Bad user experience

**Bug:**
```tsx
// Line 367 - Using browser alert() instead of proper UI
alert('DOCX export feature is coming soon. Please use LaTeX export for now.')
```

**Issue:** Using `alert()` blocks the UI and provides poor user experience. Modern React applications should use proper notification components like the Alert component already imported.

**Impact:** Users will see intrusive browser alerts instead of integrated notifications.

**Fix:**
```tsx
// Replace the alert() call with a proper error state:
const [notification, setNotification] = useState<string | null>(null)

// Then in handleExportDOCX:
const handleExportDOCX = async () => {
  try {
    // Note: DOCX export endpoint doesn't exist yet
    setNotification('DOCX export feature is coming soon. Please use LaTeX export for now.')
  } catch (err: any) {
    const errorMessage = err?.message || 'DOCX export failed'
    setError(errorMessage)
  }
}

// Add notification display in JSX:
{notification && (
  <Alert variant="default" className="fixed bottom-4 right-4 max-w-md z-50">
    <AlertTitle>Notice</AlertTitle>
    <AlertDescription>{notification}</AlertDescription>
  </Alert>
)}
```

---

## Medium Priority Bugs

### 6. API Endpoint - Missing Error Handling ⚠️ **MEDIUM**

**File:** [`api/main.py`](api/main.py:1320)  
**Line:** 1320  
**Severity:** MEDIUM - Poor error handling

**Bug:**
```python
# Line 1320 - Missing closing quote in dict key
err = resp.json().get('error', {})
```

**Issue:** The string `'error'` is missing a closing quote. While Python will still parse this (treating the rest as part of the string), it's a syntax error that could cause unexpected behavior.

**Impact:** Error parsing may fail or produce incorrect results.

**Fix:**
```python
// Change line 1320 from:
err = resp.json().get('error', {})

// To:
err = resp.json().get('error', {})
```

---

### 7. API Endpoint - Inconsistent Error Logging ⚠️ **MEDIUM**

**File:** [`api/main.py`](api/main.py:1297-1327)  
**Lines:** 1297, 1301, 1306, 1311, 1313, 1315, 1323, 1326  
**Severity:** MEDIUM - Production code has debug logging

**Bug:**
```python
# Multiple instances of [DEBUG] logging in production code
logger.info(f"[DEBUG] test_connection_endpoint called with: service_type={request.service_type}...")
logger.warning("[DEBUG] API Key is missing")
logger.info(f"[DEBUG] Testing LLM provider: {provider}")
logger.info("[DEBUG] Testing Google Gemini API")
logger.debug(f"[DEBUG] Google API URL: {url}")
logger.info(f"[DEBUG] Google API response status: {resp.status_code}")
logger.error(f"[DEBUG] Google API Error: {status} - {msg}")
logger.error(f"[DEBUG] Google API error parsing failed: {e}")
```

**Issue:** Production code contains `[DEBUG]` prefixes in log messages. These should be using proper logging levels (DEBUG, INFO, WARNING, ERROR) and the `[DEBUG]` prefix should be removed or only shown in debug mode.

**Impact:**
1. Cluttered production logs
2. Potential exposure of sensitive information
3. Makes it harder to filter logs by severity level

**Fix:**
```python
// Remove [DEBUG] prefixes and use proper logging levels:

// Line 1297:
logger.info(f"test_connection_endpoint called with: service_type={request.service_type}, provider={request.provider}, has_key={bool(request.key)}, base_url={request.base_url}, model={request.model}")

// Line 1301:
logger.warning("API Key is missing")

// Line 1306:
logger.info(f"Testing LLM provider: {provider}")

// Line 1311:
logger.info("Testing Google Gemini API")

// Line 1313:
logger.debug(f"Google API URL: {url}")

// Line 1315:
logger.info(f"Google API response status: {resp.status_code}")

// Line 1323:
logger.error(f"Google API Error: {status} - {msg}")

// Line 1326:
logger.error(f"Google API error parsing failed: {e}")
```

---

## Additional Issues Found

### 8. LM Studio Detection - Missing Port Scanning Logic

**File:** [`modules/system/connection_doctor.py`](modules/system/connection_doctor.py:261)  
**Lines:** 261-293  
**Severity:** LOW - Feature limitation

**Issue:** The LM Studio detection logic scans multiple ports but doesn't properly handle the case where LM Studio is running on a non-standard port.

**Current Implementation:**
```python
# Scans fixed list of ports
for port in self.LM_STUDIO_PORTS:
    url = f"http://localhost:{port}/v1/models"
```

**Recommendation:** Consider making the port configurable via settings or environment variable, and add better error messages when no port works.

---

### 9. Settings Panel - No Settings Configuration UI

**File:** [`src/app/page.tsx`](src/app/page.tsx)  
**Severity:** LOW - Missing feature

**Issue:** The main page doesn't have a settings/configuration panel. Users cannot configure API keys, model preferences, or other settings from the UI.

**Impact:** Users must manually edit configuration files to change settings, which is not user-friendly.

**Recommendation:** Add a settings modal or page with:
- API key configuration
- Model selection
- Service URLs
- Research preferences
- Export settings

---

## Summary of Bugs

| # | Component | Bug | Severity | Line | File |
|---|-----------|-----|----------|-------|------|
| 1 | LM Studio | Variable name typo (`PREFERRED_MODELS` vs `PREFERRED_MODELS`) | CRITICAL | 189 | [`modules/llm/adapters.py`](modules/llm/adapters.py:189) |
| 2 | API | Incorrect Google API URL (`generativelanguage` vs `generativelanguage`) | CRITICAL | 1312 | [`api/main.py`](api/main.py:1312) |
| 3 | Connection Doctor | Variable name mismatch (`hf_key` vs `huggingface_key`) | CRITICAL | 463 | [`modules/system/connection_doctor.py`](modules/system/connection_doctor.py:463) |
| 4 | Settings Panel | Alert variant typo (`destructive` vs `destructive`) | HIGH | 702 | [`src/app/page.tsx`](src/app/page.tsx:702) |
| 5 | Settings Panel | Poor UX with browser `alert()` | HIGH | 367 | [`src/app/page.tsx`](src/app/page.tsx:367) |
| 6 | API | Missing closing quote in dict key | MEDIUM | 1320 | [`api/main.py`](api/main.py:1320) |
| 7 | API | Inconsistent debug logging in production | MEDIUM | Multiple | [`api/main.py`](api/main.py) |

---

## Recommended Fix Priority

### Immediate (Before Testing)
1. **Fix LM Studio variable typo** - Line 189 in [`modules/llm/adapters.py`](modules/llm/adapters.py:189)
2. **Fix Google API URL** - Line 1312 in [`api/main.py`](api/main.py:1312)
3. **Fix HuggingFace variable name** - Line 463 in [`modules/system/connection_doctor.py`](modules/system/connection_doctor.py:463)

### Short-term (After Basic Testing)
4. **Fix Alert variant typo** - Line 702 in [`src/app/page.tsx`](src/app/page.tsx:702)
5. **Replace alert() with proper notifications** - Line 367 in [`src/app/page.tsx`](src/app/page.tsx:367)
6. **Fix missing quote in API** - Line 1320 in [`api/main.py`](api/main.py:1320)

### Long-term (Production Ready)
7. **Clean up debug logging** - Remove `[DEBUG]` prefixes throughout [`api/main.py`](api/main.py)
8. **Add Settings UI** - Create proper settings panel for configuration
9. **Improve LM Studio detection** - Make ports configurable and add better error messages

---

## Testing Recommendations

After fixing these bugs, test the following:

1. **LM Studio Integration:**
   - Start LM Studio with a model loaded
   - Test model auto-detection
   - Test connection from API
   - Test auto-start functionality

2. **API Endpoints:**
   - Test Google Gemini API connection
   - Test OpenRouter API connection
   - Test HuggingFace API connection
   - Test error handling for invalid keys

3. **Settings Panel:**
   - Test error notifications
   - Test export functionality
   - Test knowledge graph query
   - Verify all UI components render correctly

---

## Conclusion

The BioDockify project has several critical bugs that will prevent core functionality from working:

- **LM Studio integration will fail** due to variable name typo
- **Google Gemini API will not work** due to incorrect URL
- **HuggingFace validation will fail** due to variable name mismatch

These bugs should be fixed immediately before attempting to run or test the application. The medium and low priority issues should be addressed for production readiness.

**Estimated Time to Fix Critical Bugs:** 15-30 minutes  
**Risk Level:** Low (fixes are straightforward typos and variable name corrections)

---

**Report Generated By:** Debug Mode Analysis  
**Next Steps:** Implement fixes starting with critical bugs
