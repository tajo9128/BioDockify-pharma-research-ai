#!/bin/bash
# Simple icon generator for BioDockify AI
# Converts the SVG icon to required PNG formats

echo "🎨 Generating icons for BioDockify AI..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing..."
    
    # Detect OS and install ImageMagick
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y imagemagick
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    elif [[ "$OSTYPE" == "msys" ]]; then
        # Windows - suggest manual installation
        echo "Please install ImageMagick for Windows from: https://imagemagick.org/script/download.php"
        exit 1
    fi
fi

ICON_DIR="desktop/icons"
SOURCE_ICON="desktop/icons/icon.svg"

# Create output directory if it doesn't exist
mkdir -p "$ICON_DIR"

# Generate different sizes
echo "📦 Generating 32x32 icon..."
convert "$SOURCE_ICON" -resize 32x32 -background transparent "$ICON_DIR/32x32.png"

echo "📦 Generating 128x128 icon..."
convert "$SOURCE_ICON" -resize 128x128 -background transparent "$ICON_DIR/128x128.png"

echo "📦 Generating 256x256 icon (high DPI)..."
convert "$SOURCE_ICON" -resize 256x256 -background transparent "$ICON_DIR/128x128@2x.png"

echo "✅ Icons generated successfully!"
echo ""
echo "Generated files:"
ls -lh "$ICON_DIR"/*.png 2>/dev/null || echo "No PNG files found"
echo ""
echo "Note: For Windows .ico and macOS .icns, use 'bun run tauri:icon'"
