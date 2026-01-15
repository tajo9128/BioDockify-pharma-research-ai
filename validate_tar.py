
import tarfile
import sys
import os

file_path = r"C:\Users\tajud\.gemini\antigravity\playground\ancient-bohr\workspace-490c1576-ea55-4f0d-9387-24a927b53718.tar"

print(f"Checking file: {file_path}")

if not os.path.exists(file_path):
    print("Error: File does not exist")
    sys.exit(1)

try:
    with tarfile.open(file_path, "r") as tar:
        print("File opened successfully.")
        print("Contents:")
        for member in tar.getmembers():
            print(f" - {member.name} ({member.size} bytes)")
        print("\nIntegrity check passed.")
except tarfile.ReadError:
    print("Error: File is corrupted or not a valid tar archive.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
