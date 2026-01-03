# BioDockify Release Guide

Follow these steps to package and release **BioDockify Desktop Edition** for production.

## 1. Final Cleanup
- [ ] Run `runtime/env_check.py` to ensure all dependencies are clean.
- [ ] Delete any temporary `.log` files in `brain/knowledge_graph/logs`.
- [ ] Ensure `runtime/config.yaml` is NOT present (so users generate their own).

## 2. Build the Desktop Executable
1.  Navigate to the Tauri directory:
    ```bash
    cd desktop/tauri
    ```
2.  Run the build command:
    ```bash
    npm run tauri build
    ```
    *This will produce `desktop/tauri/src-tauri/target/release/bio-dockify.exe`.*

## 3. Create the Installer
1.  Navigate to the `installer` directory.
2.  Right-click `setup.nsi` and select **"Compile NSIS Script"**.
3.  This will generate `BioDockify_Setup.exe` in the project root.

## 4. GitHub Release
1.  **Tag the Release**:
    ```bash
    git tag -a v1.0.0 -m "First Production Release"
    git push origin v1.0.0
    ```
2.  **Create Release on GitHub**:
    *   Go to your repository -> **Releases** -> **Draft a new release**.
    *   Choose tag `v1.0.0`.
    *   Title: `BioDockify v1.0.0 - Desktop Edition`.
    *   Description: "First official release of the Zero-Cost Pharma Research AI."
3.  **Upload Assets**:
    *   Upload `BioDockify_Setup.exe`.
    *   *(Optional)* Upload `checksums.txt`.

## 5. Post-Release
-   Verify the downloaded installer runs on a clean VM.
-   Check that `config_loader` correctly creates the default `config.yaml` on first launch.
