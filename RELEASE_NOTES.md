# Release Notes - BioDockify Desktop v2.17.4

**Release Date**: 2026-01-28

## 🎯 Highlights

### Enhanced First-Run Self-Healing System
The first-run experience is now **robust and self-healing**. Agent Zero can automatically detect and resolve connection issues from the outset.

## ✨ New Features

### LM Studio Auto-Start
- Automatic detection on ports [1234, 1235, 8080, 5000, 8000]
- Windows executable discovery with registry fallback
- Background launch via subprocess for seamless startup
- 30-second initialization wait with retry logic

### Connectivity Healing Wizard Step
- New **Connectivity** step in First-Run Wizard (step 1)
- Real-time diagnosis with visual status indicators
- "Start LM Studio" button for one-click launch
- Client-side fallback when backend is unavailable

### New API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/diagnose/connectivity` | GET | Full system diagnosis |
| `/api/diagnose/repair/{id}` | POST | Targeted repair attempt |
| `/api/diagnose/lm-studio/start` | POST | Explicit LM Studio launch |

## 🔧 Changes

### Files Added
- `modules/system/connection_doctor.py` - Self-healing connection manager (550 lines)
- `ui/src/components/wizard/ConnectivityHealer.tsx` - Auto-repair UI component (400 lines)

### Files Modified
- `api/main.py` - Added 3 diagnosis endpoints (+120 lines)
- `ui/src/components/FirstRunWizard.tsx` - Integrated connectivity step
- `ui/src/components/wizard/WizardConsent.tsx` - Added privacy disclosure

### First-Run Flow (Updated)
```
Welcome → Connectivity (NEW) → System → Research → Summary
```

## 🔒 Privacy

- Internet connectivity checks ping: `google.com`, `cloudflare.com`, `github.com`
- LM Studio detection is local-only (localhost port scanning)
- All checks are disclosed in the Consent flow

## 📦 Version Updates
- Root: 2.17.3 → 2.17.4
- UI: 2.16.8 → 2.17.4
- Desktop: 2.16.8 → 2.17.4
- API: 2.16.8 → 2.17.4

---

**Full Changelog**: v2.17.3...v2.17.4
