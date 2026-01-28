# BioDockify v2.17.6 Release Notes

**Build:** 2026.01.28.01  
**Status:** Stable / Release Candidate

## 🚀 Key Features & Updates

### 1. Persistent First-Run Configuration
- **Fixed Loop Issue:** Resolved a critical bug where the First Run Wizard would reappear on every application launch.
- **Smart Persistence:** Settings are now merged rather than overwritten, ensuring that completion status (`biodockify_first_run_complete`) remains persistent while preserving other user preferences.
- **Self-Healing Update:** The underlying self-configuration logic (`self-config.ts`) has been hardened to respect existing configuration flags more reliably.

### 2. Personalized User Experience
- **"Welcome Back" Feature:** The Home Dashboard now greets you by name ("Welcome Back, Dr. [Name]") instead of a generic title.
- **New Persona Setting:** Added a **"Full Name"** input field in `Settings -> Research Persona`.
    - Users can now define how they wish to be addressed by Agent Zero.
    - If no name is provided, it gracefully falls back to "Researcher".

### 3. General Improvements
- **Start-up Optimization:** Improved settings loading time by caching the user's name in `localStorage` for instant dashboard rendering.
- **Type Safety:** Resolved TypeScript checking errors in the Settings panel for better build stability.

---

## 🔧 Technical Details
- **Frontend:** Updated `FirstRunWizard.tsx`, `HomeDashboard.tsx`, `SettingsPanel.tsx`.
- **Backend:** Bumped API version to match frontend (`v2.17.6`).
- **State Management:** Enhanced `localStorage` handling for `biodockify_settings`.

> **Note:** The planned Licensing System has been placed on hold and will be targeted for a future release (v2.18.x).
