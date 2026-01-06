from PIL import Image, ImageDraw, ImageOps
import os
import sys

def create_icons(source_path):
    if not os.path.exists(source_path):
        print(f"Error: Source image {source_path} not found.")
        return

    icon_dir = "desktop/tauri/src-tauri/icons"
    os.makedirs(icon_dir, exist_ok=True)
    
    try:
        img = Image.open(source_path).convert("RGBA")
        
        # 1. Create masked circular/rounded version (Squircle approximation)
        size = (1024, 1024)
        mask = Image.new('L', size, 0)
        draw = ImageDraw.Draw(mask)
        # Draw a rounded rectangle
        draw.rounded_rectangle((0, 0) + size, radius=200, fill=255)
        
        # Resize original to fit
        img_resized = img.resize(size, Image.Resampling.LANCZOS)
        output = ImageOps.fit(img_resized, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)
        
        # Save Formats
        
        # 32x32.png
        output.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(icon_dir, "32x32.png"))
        
        # 128x128.png
        output.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(icon_dir, "128x128.png"))
        
        # 128x128@2x.png (256x256)
        output.resize((256, 256), Image.Resampling.LANCZOS).save(os.path.join(icon_dir, "128x128@2x.png"))
        
        # icon.ico (Contains 256, 128, 64, 48, 32, 16)
        output.save(os.path.join(icon_dir, "icon.ico"), format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
        
        # icon.icns (Mac) - Basic save, might need specialized tools for proper ICNS but Pillow supports basics
        output.save(os.path.join(icon_dir, "icon.icns"), format='ICNS')

        print(f"Successfully generated icons in {icon_dir}")

    except Exception as e:
        print(f"Failed to process image: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        create_icons(sys.argv[1])
    else:
        print("Usage: python convert_icons_v2.py <path_to_source_image>")
