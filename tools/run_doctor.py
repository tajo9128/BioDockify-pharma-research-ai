import sys
import os
import json

# Add root to path
sys.path.append(os.getcwd())

from runtime.config_loader import load_config
from modules.system.doctor import SystemDoctor

def main():
    print("Loading Config...")
    cfg = load_config()
    
    print("Initializing System Doctor...")
    doc = SystemDoctor(cfg)
    
    print("Running Diagnosis...")
    report = doc.run_diagnosis()
    
    print("\n=== SYSTEM HEALTH REPORT ===")
    print(json.dumps(report, indent=2))
    
    if report["status"] == "healthy":
        print("\n✅ System is HEALTHY")
        sys.exit(0)
    else:
        print(f"\n⚠️ System is {report['status'].upper()}")
        sys.exit(1)

if __name__ == "__main__":
    main()
