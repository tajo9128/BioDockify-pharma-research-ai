# Installation Guide

**BioDockify** is designed as a desktop application for Windows 10 and Windows 11. It utilizes a "Sidecar" architecture where the lightweight interface manages a robust local AI backend running in Docker containers.

## System Requirements

*   **Operating System:** Windows 10 (Build 19044+) or Windows 11 (x64)
*   **Processor:** Intel Core i5 / AMD Ryzen 5 or better (AVX support required)
*   **RAM:** 16 GB minimum (32 GB recommended for large knowledge graphs)
*   **Disk Space:** 10 GB free space (for Docker images and database)
*   **Software:** Docker Desktop (Required)

---

## Step-by-Step Installation

### 1. Prerequisites (Docker)
BioDockify relies on **Docker Desktop** to run its heavy AI models (TensorFlow/BioBERT) in a consistent, isolated environment.

1.  Download **Docker Desktop for Windows** from [docker.com](https://www.docker.com/products/docker-desktop/).
2.  Install Docker and **Restart your computer**.
3.  Ensure Docker is running (look for the whale icon in your system tray).

### 2. Install BioDockify
1.  Go to the [GitHub Releases Page](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases).
2.  Download the latest installer: `BioDockify_Professional_Setup_v2.0.exe`.
3.  Double-click to run.
4.  **Permissions:** The installer will request Administrator privileges to install into `Program Files` and create shortcuts.
5.  **Components:** Ensure "Main App" and "Desktop Shortcut" are selected.
6.  Click **Install**.

### 3. First Launch
1.  Double-click the **BioDockify AI** icon on your desktop.
2.  The application will launch.
3.  **Backend Initialization:** On the first run, the app may take 1-2 minutes to initialize the local Neo4j database and load the NLP models. Please be patient.

---

## Troubleshooting

### "Docker not found" Error
*   **Cause:** Docker Desktop is not running or not installed.
*   **Fix:** Launch Docker Desktop from your Start Menu. Wait for the initialization to complete, then restart BioDockify.

### Installer "Silently Fails"
*   **Cause:** Using an older installer version (pre-v2.0.37) without Admin rights.
*   **Fix:** Ensure you are using **v2.0.37+**. If the issue persists, right-click the installer and select "Run as Administrator".

### "Smart App Control" Blocked by Windows
*   **Cause:** Windows 11 Smart App Control blocks unsigned applications from unknown publishers.
*   **Fix:** 
    1.  **Right-click** the downloaded `.exe` file.
    2.  Select **Properties**.
    3.  In the **General** tab, check the **Unblock** box under the "Security" section.
    4.  Click **Apply** and then **OK**.
    5.  Run the installer again.

### "Backend Connection Failed"
*   **Cause:** Port conflict (usually port 8000 or 7687).
*   **Fix:** Ensure no other services (like other Graph DBs or Python web servers) are using ports 8000, 7474, or 7687.

---
**Need Help?**
Open an issue on particular [GitHub Issues](https://github.com/tajo9128/BioDockify-pharma-research-ai/issues).
