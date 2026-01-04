from PIL import Image
import os
import sys

def convert_logo():
    source = r"C:\Users\tajud\.gemini\antigravity\brain\3d273a3b-dc31-4f80-8ae5-9158ff273c2c\uploaded_image_1767521783373.jpg"
    ui_dest = r"C:\Users\tajud\.gemini\antigravity\playground\volatile-curiosity\ui\public\logo.png"
    icon_dest_png = r"C:\Users\tajud\.gemini\antigravity\playground\volatile-curiosity\desktop\tauri\src-tauri\icons\icon.png"
    icon_dest_ico = r"C:\Users\tajud\.gemini\antigravity\playground\volatile-curiosity\desktop\tauri\src-tauri\icons\icon.ico"
    installer_icon = r"C:\Users\tajud\.gemini\antigravity\playground\volatile-curiosity\installer\install.ico"

    print(f"Processing {source}...")
    
    try:
        img = Image.open(source)
        
        # 1. Save Full Logo for UI Header (as PNG)
        print(f"Saving UI logo to {ui_dest}")
        img.save(ui_dest, "PNG")
        
        # 2. Create Square Symbol for Icons
        # If wide aspect ratio, crop the left square (Symbol)
        width, height = img.size
        if width > height * 1.2:
            print("Wide logo detected. Cropping left square for icon...")
            # Crop to a square based on height
            icon_img = img.crop((0, 0, height, height))
        else:
            icon_img = img
            
        # Optional: specific resize for quality
        icon_img = icon_img.resize((256, 256), Image.Resampling.LANCZOS)

        # Save as PNG for Tauri Source
        print(f"Saving Source Icon to {icon_dest_png}")
        icon_img.save(icon_dest_png, "PNG")
        
        # Save as ICO for Installer
        print(f"Saving Installer Icon to {installer_icon}")
        icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
        icon_img.save(icon_dest_ico, "ICO", sizes=icon_sizes)
        icon_img.save(installer_icon, "ICO", sizes=icon_sizes)
        
        print("Conversion Complete!")
        
    except Exception as e:
        print(f"Error converting image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    convert_logo()
