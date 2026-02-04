#!/usr/bin/env python3
import subprocess
import time
import sys
import os
import signal

def main():
    print("[Launcher] Starting BioDockify Backend Monitor...")
    
    server_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")
    python_exe = sys.executable

    while True:
        try:
            print("[Launcher] Launching server.py...")
            # Run server.py as a subprocess
            process = subprocess.Popen([python_exe, server_script])
            
            # Wait for it to complete (it shouldn't, unless it crashes)
            process.wait()
            
            print(f"[Launcher] Server process exited with code {process.returncode}")
            
            # If it exited cleanly (0), maybe we want to stop? 
            # But usually it means shutdown. For now, we assume we want it always running 
            # unless the launcher itself is killed.
            
            print("[Launcher] Restarting in 2 seconds...")
            time.sleep(2)
            
        except KeyboardInterrupt:
            print("[Launcher] Stopping due to keyboard interrupt...")
            if 'process' in locals() and process:
                process.terminate()
            break
        except Exception as e:
            print(f"[Launcher] Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
