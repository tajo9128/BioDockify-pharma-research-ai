import os
import shutil
from PIL import Image

def update_icons():
    # Source path (User approved artifact, assuming it will be copied to ui/public/logo.png first)
    source_path = os.path.join("ui", "public", "logo.png")
    
    if not os.path.exists(source_path):
        print(f"❌ Source icon not found at {source_path}")
        return

    icon_dir = os.path.join("desktop", "tauri", "src-tauri", "icons")
    os.makedirs(icon_dir, exist_ok=True)

    print(f"🎨 Updating icons in {icon_dir} from {source_path}...")

    try:
        img = Image.open(source_path)
        
        # 1. Save standard PNGs
        img.save(os.path.join(icon_dir, "icon.png"), "PNG")
        print("✅ Saved icon.png")
        
        img.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(icon_dir, "128x128.png"), "PNG")
        print("✅ Saved 128x128.png")
        
        img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(icon_dir, "32x32.png"), "PNG")
        print("✅ Saved 32x32.png")
        
        # 2. Generate ICO (Windows)
        # ICO support in Pillow works by passing multiple sizes
        icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save(os.path.join(icon_dir, "icon.ico"), format="ICO", sizes=icon_sizes)
        print("✅ Saved icon.ico")

        # 3. Generate ICNS (Mac) - Basic fallback if typical tools unavailable, 
        # but for now we'll just duplicate the png as icns is complex structure, 
        # usually simpler to just save png for internal usage or require external tool.
        # Actually Pillow DOES NOT support saving ICNS directly properly without external libs often.
        # We will skip ICNS generation if complex, or try basic save.
        try:
           img.save(os.path.join(icon_dir, "icon.icns"), format="ICNS")
           print("✅ Saved icon.icns")
        except Exception as e:
           print(f"⚠️ Could not save ICNS directly (common limitation): {e}")

    except Exception as e:
        print(f"❌ Error processing icons: {e}")

if __name__ == "__main__":
    # Ensure Pillow is installed
    try:
        import PIL
        update_icons()
    except ImportError:
        print("⚠️ Pillow not found. Installing...")
        os.system(f"{sys.executable} -m pip install Pillow")
        update_icons()
