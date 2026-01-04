# BioDockify AI - Tauri Desktop Application

Complete Tauri desktop application setup for BioDockify Pharmaceutical Research Platform.

## 📁 Project Structure

```
/home/z/my-project/
├── desktop/              # Tauri desktop app
│   ├── src-tauri/    # Rust backend
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── lib.rs
│   │   │   └── build.rs
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   └── icons/          # App icons
├── src/               # Next.js frontend (current project)
├── package.json
└── tsconfig.json
```

## 🚀 Installation & Setup

### Prerequisites

1. **Rust Toolchain** (required for Tauri):
   ```bash
   # macOS/Linux
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Windows (use PowerShell)
   irm https://win.rustup.rs/x86_64 | iex
   ```

2. **Node.js & Bun**:
   ```bash
   # Should already have these from current project
   bun --version
   node --version
   ```

3. **System Dependencies**:
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install -y libwebkit2gtk-4.1-dev \
       build-essential \
       curl \
       wget \
       libssl-dev \
       libayatana-appindicator3-dev \
       librsvg2-dev
   ```

   **Fedora:**
   ```bash
   sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget libappindicator-gtk3 librsvg2-devel
   ```

   **Arch Linux:**
   ```bash
   sudo pacman -Syu
   sudo pacman -S --needed webkit2gtk-4.1 openssl curl wget librsvg2
   ```

   **macOS** (no additional deps needed)

   **Windows** (no additional deps needed, Visual Studio C++ Build Tools recommended)

### Install Dependencies

```bash
cd /home/z/my-project

# Install Tauri CLI (dev dependency)
bun install
```

## 🎨 Build Icons

### Option 1: Using tauri-icon CLI (Recommended)

```bash
cd /home/z/my-project
bun run tauri:icon
```

This will generate all required icon formats automatically.

### Option 2: Manual Icon Creation

If you want custom icons, create them in `desktop/icons/`:

Required files:
- `32x32.png` - 32x32 pixel
- `128x128.png` - 128x128 pixel
- `128x128@2x.png` - 256x256 pixel (high DPI)
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon bundle

Using ImageMagick:
```bash
convert icon.svg -resize 32x32 -background transparent icons/32x32.png
convert icon.svg -resize 128x128 -background transparent icons/128x128.png
convert icon.svg -resize 256x256 -background transparent icons/128x128@2x.png
```

## 🏗️ Building the Application

### Development Mode

```bash
cd /home/z/my-project
bun run tauri
```

This will:
1. Start Next.js dev server on port 3000
2. Launch Tauri app with dev hot-reload
3. Open application window

### Production Build

```bash
cd /home/z/my-project
bun run build         # Build Next.js
bun run tauri:build  # Build Tauri app
```

Output location: `desktop/src-tauri/target/release/bundle/`

### Create Production Tar Archive

```bash
cd /home/z/my-project
bun run tar
```

This creates: `biodockify-ai.tar.gz` with the complete built application.

## 🔧 Tauri Configuration

### tauri.conf.json

The configuration file contains:

- **Window Settings**: 1280x720, resizable, centered
- **Security**: CSP policies for embedded webview
- **File System**: Read/write access
- **Network**: HTTP/HTTPS access for API calls
- **Platforms**: Windows, macOS, Linux support
- **Installer**: NSIS (Windows), AppImage (Linux), DMG (macOS)

### Available Tauri Commands

The app exposes these Rust commands to the frontend:

```typescript
import { invoke } from '@tauri-apps/api/core';

// Greeting
await invoke('greet', { name: 'World' });

// App Info
await invoke('get_app_info');

// System Info
await invoke('get_system_info');

// Open URL in browser
await invoke('open_url', { url: 'https://example.com' });

// Open file
await invoke('open_file', { path: '/path/to/file' });

// Show in folder
await invoke('show_in_folder', { path: '/path/to/file' });

// Window controls
await invoke('minimize_window');
await invoke('maximize_window');
await invoke('toggle_fullscreen');

// Check if dev mode
await invoke('is_dev');

// Get config path
await invoke('get_config_path');
```

## 🐛 Troubleshooting

### Build Errors

**Error: "no cache found"**
```bash
rm -rf .next
bun run build
```

**Error: "Failed to collect page data"**
Check API routes don't have conflicting export configurations.

**Error: Rust compilation errors**
Ensure Rust is properly installed:
```bash
rustc --version
cargo --version
```

### Tauri Dev Issues

**App won't open**
- Check if port 3000 is available
- Verify Next.js dev server is running
- Check console for errors

**Hot reload not working**
- Ensure `withGlobalTauri` is set to true in tauri.conf.json
- Check file watcher permissions

### Security Vulnerabilities

The user mentioned these vulnerabilities:
```
4 vulnerabilities (3 moderate, 1 critical)
```

To fix:
```bash
npm audit fix --force
```

Update Next.js to latest version:
```bash
bun update next@latest
```

## 📦 Distribution

### Windows (NSIS Installer)

After build, find:
```
desktop/src-tauri/target/release/bundle/nsis/biodockify-ai_1.0.0_x64_en-US.NSIS
```

### macOS (DMG)

After build, find:
```
desktop/src-tauri/target/release/bundle/dmg/BioDockify AI_1.0.0_x64.dmg
```

### Linux (AppImage)

After build, find:
```
desktop/src-tauri/target/release/bundle/appimage/biodockify-ai_1.0.0_amd64.AppImage
```

### Tar Archive (Custom)

After running `bun run tar`, find:
```
biodockify-ai.tar.gz
```

## 📝 Development Workflow

### Typical Dev Cycle:

1. Make changes to Next.js code in `src/`
2. Changes auto-reload in Tauri window
3. Make changes to Rust code in `desktop/src-tauri/src/`
4. Tauri automatically rebuilds Rust

### Using Tauri APIs in React:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

// Read configuration
const config = await readTextFile('config.yaml');

// Write configuration
await writeTextFile('config.yaml', yamlContent);

// Open external URLs
await open('https://pubmed.ncbi.nlm.nih.gov/');
```

## 🔒 Security Notes

- **CSP Configured**: Content Security Policy set in tauri.conf.json
- **API Calls**: HTTP/HTTPS allowed for external APIs
- **File Access**: Scoped to necessary directories only
- **Dev Mode**: Detection command available for conditional logic

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [Tauri CLI Commands](https://tauri.app/v1/api/cli)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🎯 Production Checklist

Before releasing:

- [ ] Run `bun run build` - builds without errors
- [ ] Run `bun run tauri:build` - creates distribution
- [ ] Test installer on clean machine
- [ ] Verify all features work in production build
- [ ] Update version numbers
- [ ] Generate proper icons
- [ ] Code sign executables (if distributing)
- [ ] Create tar archive for distribution
- [ ] Update documentation

## 🆘 Support

For issues or questions:
1. Check Tauri logs in dev console
2. Review browser console for frontend errors
3. Check Tauri documentation
4. Verify all dependencies are properly installed
