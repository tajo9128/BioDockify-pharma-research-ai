"""
Simple Version Verification Script
Checks if version and title updates were applied correctly
"""

import os
import re

def check_file_version(filepath, pattern, expected_version):
    """Check if file contains expected version"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            matches = re.findall(pattern, content)
            if matches:
                print(f"   OK: {filepath}")
                for match in matches:
                    print(f"      Found: {match}")
                return True
            else:
                print(f"   MISSING: {filepath}")
                print(f"      Expected version: {expected_version}")
                return False
    except Exception as e:
        print(f"   ERROR: {filepath} - {e}")
        return False

def main():
    print("="*60)
    print("BioDockify Version Verification (v2.4.1)")
    print("="*60)
    
    expected_version = "2.4.1"
    
    results = []
    
    # 1. version_info.txt
    print("\n[1] Checking version_info.txt...")
    results.append(check_file_version("version_info.txt", r'2\.4\.1', expected_version))
    
    # 2. package.json
    print("\n[2] Checking package.json...")
    results.append(check_file_version("package.json", r'"version":\s*"2\.4\.1"', expected_version))
    
    # 3. ui/package.json
    print("\n[3] Checking ui/package.json...")
    results.append(check_file_version("ui/package.json", r'"version":\s*"2\.4\.1"', expected_version))

    # 4. api/main.py
    print("\n[4] Checking api/main.py...")
    results.append(check_file_version("api/main.py", r'version="2\.4\.1"', expected_version))

    # 5. runtime/config_loader.py
    print("\n[5] Checking runtime/config_loader.py...")
    results.append(check_file_version("runtime/config_loader.py", r'"version":\s*"2\.4\.1"', expected_version))

    # 6. README.md
    print("\n[6] Checking README.md...")
    results.append(check_file_version("README.md", r'v2\.4\.1', expected_version))

    # 7. INSTALLATION.md
    print("\n[7] Checking INSTALLATION.md...")
    results.append(check_file_version("INSTALLATION.md", r'2\.4\.1', expected_version))

    # 8. Dockerfile
    print("\n[8] Checking Dockerfile...")
    results.append(check_file_version("Dockerfile", r'2\.4\.1', expected_version))
    
    # 9. NanoBotPanel.tsx
    print("\n[9] Checking ui/src/components/NanoBotPanel.tsx...")
    results.append(check_file_version("ui/src/components/NanoBotPanel.tsx", r'v2\.4\.1', expected_version))

    # 10. HomeDashboard.tsx
    print("\n[10] Checking ui/src/components/HomeDashboard.tsx...")
    results.append(check_file_version("ui/src/components/HomeDashboard.tsx", r'v2\.4\.1', expected_version))
    
    # 11. CHANGELOG.md
    print("\n[11] Checking CHANGELOG.md...")
    results.append(check_file_version("CHANGELOG.md", r'\[v2\.4\.1\]', expected_version))

    # Summary
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\nSUCCESS: All version updates verified!")
        return 0
    else:
        print(f"\nFAILED: {total - passed} check(s) failed")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
