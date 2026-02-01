from PIL import Image
import os

# Paths
base_dir = r"c:\Users\biodo\.gemini\antigravity\playground\BioDockify- Pharma Research AI\desktop\tauri\src-tauri\icons"
sidebar_png = os.path.join(base_dir, "installer_sidebar.png")
icon_png = os.path.join(base_dir, "icon.png")

sidebar_bmp = os.path.join(base_dir, "installer_sidebar.bmp")
header_bmp = os.path.join(base_dir, "installer_header.bmp")

def convert_and_resize(src, dest, size):
    try:
        if not os.path.exists(src):
            print(f"Source not found: {src}")
            return
        
        img = Image.open(src)
        # Resize to specific NSIS requirements
        # Sidebar: 164x314 (approx)
        # Header: 150x57 (approx)
        img = img.resize(size, Image.Resampling.LANCZOS)
        
        # Save as BMP
        img.save(dest, "BMP")
        print(f"Created {dest}")
    except Exception as e:
        print(f"Failed to create {dest}: {e}")

if __name__ == "__main__":
    convert_and_resize(sidebar_png, sidebar_bmp, (164, 314))
    convert_and_resize(icon_png, header_bmp, (150, 57))
