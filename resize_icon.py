from PIL import Image, ImageChops
import os

# Paths
base_dir = r"desktop\tauri\src-tauri\icons"
icon_png = os.path.join(base_dir, "icon.png")
icon_bmp = os.path.join(base_dir, "icon.bmp")
target_bmp_size = (150, 57)

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im # No change if clean

try:
    if not os.path.exists(icon_png):
        print(f"Error: {icon_png} not found. Cannot trim source.")
        exit(1)

    print(f"Opening {icon_png}...")
    with Image.open(icon_png) as img:
        print(f"Original size: {img.size}")
        
        # Trim whitespace
        # Assuming transparency or white background
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            
        # Get bounding box of non-transparent pixels
        bbox = img.getbbox()
        if bbox:
            print(f"Cropping to content: {bbox}")
            img_trimmed = img.crop(bbox)
            
            # Save trimmed PNG (Source for everything else)
            img_trimmed.save(icon_png)
            print(f"Saved trimmed PNG to {icon_png} (Size: {img_trimmed.size})")
            
            # Create BMP for Installer
            # Resize cropped image to fit 150x57 without distortion (pad if needed? or stretch?)
            # User likely wants it to fill the header. We'll verify aspect ratio.
            # For header bitmap, stretching is usually bad. We'll resize while maintaining aspect ratio 
            # and verify if center padding is needed. For now, direct resize to fill.
             
            img_bmp = img_trimmed.resize(target_bmp_size, Image.Resampling.LANCZOS)
            
            # Convert to RGB for BMP (drop alpha, use white bg)
            bg_bmp = Image.new("RGB", img_bmp.size, (255, 255, 255))
            bg_bmp.paste(img_bmp, mask=img_bmp.split()[3]) # 3 is alpha channel
            
            bg_bmp.save(icon_bmp)
            print(f"Saved trimmed/resized BMP to {icon_bmp}")
        else:
            print("Image appears empty or fully transparent.")

except Exception as e:
    print(f"Error: {e}")
