# BioDockify Release Notes v2.17.5

Welcome to BioDockify v2.17.5! This release marks a major milestone by consolidating the advanced features from the v3 development branch with our newly implemented licensing and stability core.

## 🚀 NEW: Advanced Statistics & Survival Analysis
We have integrated the highly anticipated Statistics Suite, previously in internal development. These features are now available to all users who verify their free license.

- **Statistical Analysis Tiers**: From basic descriptive statistics to advanced analytical models.
- **Power Analysis**: Calculate required sample sizes for research studies.
- **Survival Analysis**: Perform Kaplan-Meier and Cox Regression analysis on pharmaceutical data.
- **Visualization Engine**: Generate publication-ready statistical plots.

## 🔑 Enhanced Licensing System
Access to premium features is now gated by a simplified, free verification system.
- **Statistics Lock**: The new statistics module now requires Name/Email verification to unlock.
- **Persistent Persona**: Your research persona is now consistently remembered across sessions.
- **Workspace Gating**: Centralized workspace locking for unlicensed users.

## 🛠️ Build & Stability Fixes
- **TensorFlow Stability**: Resolved critical `AttributeError` and dependency conflicts on Windows.
- **Python Environment Support**: Optimized for Python 3.10-3.12 (Legacy Stable stack).
- **Merge Consolidation**: Successfully integrated `v3.0.0-dev` while preserving v2 enhancements.

## 📦 How to Update
Run the following in your project directory:
```powershell
git pull origin main
pip install -r requirements.txt
npm install
```

---
*Thank you for being part of the BioDockify community. We’re building the future of autonomous pharmaceutical research together.*
