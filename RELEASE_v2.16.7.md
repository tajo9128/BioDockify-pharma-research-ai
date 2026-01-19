# Release v2.16.7

## Release Summary

Successfully released BioDockify Desktop Application version 2.16.7 with critical CloudAPIs connection test fixes and comprehensive debugging improvements.

## Release Date

January 19, 2026

## Changes

### Bug Fixes

#### CloudAPIs Connection Test (Critical)
- **Issue:** Custom API and LM Studio connection tests were failing due to missing 'custom' key in testStatus state
- **Fix:** Added comprehensive debugging and fixed state management for connection tests

### Frontend Fixes ([`ui/src/components/SettingsPanel.tsx`](ui/src/components/SettingsPanel.tsx))

1. **Added 'custom' key to testStatus state (Line 118)**
   ```typescript
   const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
       google: 'idle',
       huggingface: 'idle',
       openrouter: 'idle',
       glm: 'idle',
       elsevier: 'idle',
       custom: 'idle'  // Added for Custom API and LM Studio tests
   });
   ```

2. **Added comprehensive debug logging to handleTestKey function (Lines 177-201)**
   - Logs provider, key status, service type, base URL, and model
   - Tracks testStatus state changes
   - Captures API responses and errors with detailed context
   - Provides clear error messages for debugging

3. **Added helpful examples for base URL input (Lines 494-496)**
   - Shows example URLs: `https://api.openai.com/v1`, `https://api.groq.com/openai/v1`
   - Helps users understand the expected format

### Backend Fixes ([`api/main.py`](api/main.py))

1. **Added comprehensive debug logging to test_connection_endpoint (Lines 1168-1195)**
   - Logs all incoming request parameters
   - Tracks provider testing progress
   - Captures API responses and errors with detailed status codes
   - Provides clear error messages for troubleshooting

2. **Enhanced Custom API connection testing (Lines 1245-1303)**
   - Method 1: Try `/models` endpoint (works for OpenAI, Groq, etc.)
   - Method 2: Try `/chat/completions` endpoint (works for GLM, custom endpoints)
   - Comprehensive error handling for different HTTP status codes
   - Detailed error messages for common issues (401, 403, 404, timeouts, etc.)

### Version Updates

Updated version numbers to 2.16.7 in:

- [`ui/package.json`](ui/package.json:3)
- [`desktop/tauri/package.json`](desktop/tauri/package.json:3)
- [`desktop/tauri/src-tauri/tauri.conf.json`](desktop/tauri/src-tauri/tauri.conf.json:10)
- [`desktop/tauri/src-tauri/Cargo.toml`](desktop/tauri/src-tauri/Cargo.toml:3)
- [`package.json`](package.json:3)

## Installation

### For Users

Download the installer from GitHub Releases:
1. Go to: https://github.com/tajo9128/BioDockify-pharma-research-ai/releases/tag/v2.16.7
2. Download `BioDockify_Setup_v2.16.7.exe`
3. Run the installer

### For Developers

Option 1: Use GitHub Actions (Recommended)
```bash
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai
git checkout v2.16.7
```

Option 2: Build Locally
```bash
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai
git checkout v2.16.7
build_all.bat
```

## GitHub Actions

The v2.16.7 tag has been pushed to GitHub, which will trigger the automated build workflow:

- **Workflow:** [`.github/workflows/release.yml`](.github/workflows/release.yml)
- **Trigger:** Tag `v2.16.7`
- **Output:**
  - `BioDockify_Setup_v2.16.7.exe` - Custom NSIS installer
  - `BioDockify.exe` - Main desktop application
  - `biodockify-engine.exe` - Python backend

## Build Process

The automated build process consists of 9 steps:

1. Install Python dependencies
2. Build Python backend with PyInstaller
3. Move backend to Tauri directory
4. Build frontend with npm
5. Copy frontend to Tauri
6. Generate icons
7. Install Tauri dependencies
8. Build Tauri desktop app
9. Build NSIS installer

## Testing

The CloudAPIs connection test fixes have been verified to resolve the following issues:

1. ✅ Custom API connection tests now work correctly
2. ✅ LM Studio connection tests now work correctly
3. ✅ Comprehensive debug logging helps identify connection issues
4. ✅ Helpful examples guide users to correct URL formats
5. ✅ State management properly tracks test status for all providers

## Known Issues

None reported for this release.

## Upgrade Notes

Users upgrading from previous versions:
- No database migration required
- No configuration changes needed
- Simply run the new installer
- Custom API and LM Studio connection tests will now work properly

## API Connection Testing Improvements

### Before v2.16.7
- Custom API tests would fail silently or show unclear errors
- No debug logging to troubleshoot connection issues
- Missing 'custom' key in testStatus state caused test failures
- Users had no examples for correct base URL format

### After v2.16.7
- All connection tests work correctly for Custom API and LM Studio
- Comprehensive debug logging provides detailed troubleshooting information
- Clear error messages for common issues (authentication, endpoints, timeouts)
- Helpful examples guide users to correct configurations
- State management properly tracks all test statuses

## Technical Details

### Debug Logging

Frontend ([`SettingsPanel.tsx`](ui/src/components/SettingsPanel.tsx:178-210)):
```typescript
console.log('[DEBUG] handleTestKey called with:', { provider, key: key ? '***' : 'missing', serviceType, baseUrl, model });
console.log('[DEBUG] Current testStatus state:', testStatus);
console.log('[DEBUG] Setting testStatus for provider:', provider, 'to testing');
console.log('[DEBUG] Calling api.testConnection with:', { serviceType, provider, baseUrl, model });
console.log('[DEBUG] API response:', res);
console.error('[DEBUG] API Test Failed with exception:', e);
```

Backend ([`api/main.py`](api/main.py:1173)):
```python
logger.info(f"[DEBUG] test_connection_endpoint called with: service_type={request.service_type}, provider={request.provider}, has_key={bool(request.key)}, base_url={request.base_url}, model={request.model}")
logger.info(f"[DEBUG] Testing LLM provider: {provider}")
logger.info(f"[DEBUG] Google API response status: {resp.status_code}")
logger.error(f"[DEBUG] Google API Error: {status} - {msg}")
```

### Connection Test Flow

1. User clicks "Test" button in Settings
2. Frontend logs initial state and parameters
3. Frontend sets testStatus to 'testing'
4. Frontend calls backend API with connection details
5. Backend logs incoming request
6. Backend attempts connection using appropriate method
7. Backend logs response or error details
8. Frontend receives response and logs it
9. Frontend updates testStatus to 'success' or 'error'
10. Frontend displays appropriate alert message

## Contributors

- Fixed CloudAPIs connection test issues
- Added comprehensive debug logging
- Enhanced error handling and user feedback
- Updated version numbers

## Support

For issues or questions:
- GitHub Issues: https://github.com/tajo9128/BioDockify-pharma-research-ai/issues
- Documentation: See [`BUILD_GUIDE.md`](BUILD_GUIDE.md) for build instructions
- Quick Start: See [`QUICK_START_BUILD.md`](QUICK_START_BUILD.md) for fast reference

## Changelog

### v2.16.7 (2026-01-19)
- Fixed CloudAPIs connection test failures for Custom API and LM Studio
- Added 'custom' key to testStatus state
- Added comprehensive debug logging to frontend and backend
- Added helpful examples for base URL input
- Enhanced error handling with detailed status codes
- Updated version numbers to 2.16.7

### v2.16.6 (Previous)
- Previous version release

---

**End of Release Notes**
