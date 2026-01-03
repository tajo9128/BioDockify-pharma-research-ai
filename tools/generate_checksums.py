import hashlib
import sys
import os

def generate_checksum(filepath):
    """Generate SHA256 checksum for a file."""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return None
    
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Read and update hash string value in blocks of 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

if __name__ == "__main__":
    files_to_check = [
        "BioDockify_Setup.exe",
        "desktop/tauri/src-tauri/target/release/bio-dockify.exe"
    ]
    
    print("Generating Checksums...")
    print("-" * 60)
    
    with open("checksums.txt", "w") as f:
        for filepath in files_to_check:
            if os.path.exists(filepath):
                checksum = generate_checksum(filepath)
                line = f"{checksum}  {os.path.basename(filepath)}"
                print(line)
                f.write(line + "\n")
            else:
                print(f"[Skipping] {filepath} (Not build yet)")
                
    print("-" * 60)
    print("checksums.txt created.")
