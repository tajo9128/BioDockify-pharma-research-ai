# BioDockify Release Guide

Follow these steps to release **BioDockify Desktop Edition**.

## 🚀 Option 1: Automated Release (Recommended)
We have set up a **GitHub Action** that automatically builds and releases the application when you push a version tag.

### 1. Commit Your Changes
Ensure all your changes are committed to the `master` branch.

### 2. Tag and Push
Run the following commands to trigger a release (e.g., for v1.0.0):
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 3. Wait for GitHub Action
1.  Go to your GitHub Repository -> **Actions** tab.
2.  You will see the "Release BioDockify Desktop" workflow running.
3.  Once green (approx 10-15 mins), go to the **Releases** page.
4.  You will find **BioDockify_Setup.exe** and `checksums.txt` automatically uploaded!

---

## 🛠️ Option 2: Manual Build (Local)
If you prefer to build locally:

### 1. Build Desktop App
```bash
cd desktop/tauri
npm run tauri build
```

### 2. Compile Installer
Right-click `installer/setup.nsi` -> **Compile NSIS Script**.

### 3. Generate Checksums
```bash
python tools/generate_checksums.py
```

### 4. Create GitHub Release
Manually upload `BioDockify_Setup.exe` and `checksums.txt` to a new Release on GitHub.
