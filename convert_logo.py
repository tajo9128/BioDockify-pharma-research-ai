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
        
        # Save as PNG for UI
        print(f"Saving UI logo to {ui_dest}")
        img.save(ui_dest, "PNG")
        
        # Save as PNG for Tauri Source
        print(f"Saving Source Icon to {icon_dest_png}")
        img.save(icon_dest_png, "PNG")
        
        # Save as ICO for Installer
        print(f"Saving Installer Icon to {installer_icon}")
        # Create sizes for ICO
        icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
        img.save(icon_dest_ico, "ICO", sizes=icon_sizes)
        img.save(installer_icon, "ICO", sizes=icon_sizes)
        
        print("Conversion Complete!")
        
    except Exception as e:
        print(f"Error converting image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    convert_logo()
