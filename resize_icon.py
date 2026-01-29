from PIL import Image
import os

icon_path = r"desktop\tauri\src-tauri\icons\icon.bmp"
target_size = (150, 57)

try:
    if not os.path.exists(icon_path):
        print(f"Error: {icon_path} not found.")
        exit(1)

    print(f"Opening {icon_path}...")
    with Image.open(icon_path) as img:
        print(f"Original size: {img.size}")
        
        # Resize using LANCZOS for best quality
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        
        print(f"Resizing to {target_size}...")
        img_resized.save(icon_path)
        print(f"Saved resized image to {icon_path}")

    # Verify size
    new_size = os.path.getsize(icon_path)
    print(f"New file size: {new_size} bytes")

except Exception as e:
    print(f"Error: {e}")
