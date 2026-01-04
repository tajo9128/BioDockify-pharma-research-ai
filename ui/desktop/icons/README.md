# Tauri Icons

This folder should contain the application icons in various formats:

## Required Icon Files:

- `32x32.png` - 32x32 pixel PNG
- `128x128.png` - 128x128 pixel PNG
- `128x128@2x.png` - 256x256 pixel PNG for high DPI
- `icon.ico` - Windows icon (use iconutil to convert)
- `icon.icns` - macOS icon bundle

## Generating Icons:

To generate proper icons from a source SVG/PNG, use:

```bash
# Using iconutil (macOS)
iconutil -c icon.icns ../icons/*.png

# Using ImageMagick
convert icon.png -define icon:auto-resize=256,128,32,16 \
    -background transparent \
    ../icons/icon-%dx%d.png

# Using tauri-icon CLI
npx @tauri-apps/tauri-icon icon.png
```

## Placeholder:
For now, create a simple placeholder by copying an existing logo:
```bash
cp ../../public/logo.svg ./icon.svg
```

Then use tools to convert to required formats.
