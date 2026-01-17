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
    print("BioDockify Version and Title Verification")
    print("="*60)
    
    expected_version = "2.16.1"
    expected_title = "BioDockify - Pharma Research AI"
    
    results = []
    
    # Check version_info.txt
    print("\n[1] Checking version_info.txt...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/version_info.txt",
        r'2\.16\.1',
        expected_version
    )
    results.append(result)
    
    # Check config.yaml
    print("\n[2] Checking runtime/config.yaml...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/runtime/config.yaml",
        r'version:\s*["\']?2\.16\.1["\']?',
        expected_version
    )
    results.append(result)
    
    # Check package.json
    print("\n[3] Checking package.json...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/package.json",
        r'"version":\s*"2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check ui/package.json
    print("\n[4] Checking ui/package.json...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/ui/package.json",
        r'"version":\s*"2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check desktop/tauri/package.json
    print("\n[5] Checking desktop/tauri/package.json...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/desktop/tauri/package.json",
        r'"version":\s*"2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check Cargo.toml
    print("\n[6] Checking desktop/tauri/src-tauri/Cargo.toml...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/desktop/tauri/src-tauri/Cargo.toml",
        r'version\s*=\s*"2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check tauri.conf.json
    print("\n[7] Checking desktop/tauri/src-tauri/tauri.conf.json...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/desktop/tauri/src-tauri/tauri.conf.json",
        r'"version":\s*"2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check api/main.py
    print("\n[8] Checking api/main.py...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/api/main.py",
        r'version="2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check installer/setup.nsi
    print("\n[9] Checking installer/setup.nsi...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/installer/setup.nsi",
        r'PRODUCT_VERSION\s+"2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check HomeDashboard.tsx
    print("\n[10] Checking ui/src/components/HomeDashboard.tsx...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/ui/src/components/HomeDashboard.tsx",
        r'v2\.16\.1',
        expected_version
    )
    results.append(result)
    
    # Check README.md
    print("\n[11] Checking README.md...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/README.md",
        r'v2\.16\.1',
        expected_version
    )
    results.append(result)
    
    # Check config_loader.py
    print("\n[12] Checking runtime/config_loader.py...")
    result = check_file_version(
        "BioDockify-pharma-research-ai/runtime/config_loader.py",
        r'"version":\s*"2\.16\.1"',
        expected_version
    )
    results.append(result)
    
    # Check title in version_info.txt
    print("\n[13] Checking software title in version_info.txt...")
    try:
        with open("BioDockify-pharma-research-ai/version_info.txt", 'r', encoding='utf-8') as f:
            content = f.read()
            if "BioDockify - Pharma Research AI" in content:
                print("   OK: BioDockify-pharma-research-ai/version_info.txt")
                print("      Found: BioDockify - Pharma Research AI")
                results.append(True)
            else:
                print("   MISSING: BioDockify-pharma-research-ai/version_info.txt")
                print("      Expected: BioDockify - Pharma Research AI")
                results.append(False)
    except Exception as e:
        print(f"   ERROR: {e}")
        results.append(False)
    
    # Check title in installer/setup.nsi
    print("\n[14] Checking software title in installer/setup.nsi...")
    try:
        with open("BioDockify-pharma-research-ai/installer/setup.nsi", 'r', encoding='utf-8') as f:
            content = f.read()
            if "BioDockify - Pharma Research AI" in content:
                print("   OK: BioDockify-pharma-research-ai/installer/setup.nsi")
                print("      Found: BioDockify - Pharma Research AI")
                results.append(True)
            else:
                print("   MISSING: BioDockify-pharma-research-ai/installer/setup.nsi")
                print("      Expected: BioDockify - Pharma Research AI")
                results.append(False)
    except Exception as e:
        print(f"   ERROR: {e}")
        results.append(False)
    
    # Check title in tauri.conf.json
    print("\n[15] Checking software title in tauri.conf.json...")
    try:
        with open("BioDockify-pharma-research-ai/desktop/tauri/src-tauri/tauri.conf.json", 'r', encoding='utf-8') as f:
            content = f.read()
            if "BioDockify - Pharma Research AI" in content:
                print("   OK: BioDockify-pharma-research-ai/desktop/tauri/src-tauri/tauri.conf.json")
                print("      Found: BioDockify - Pharma Research AI")
                results.append(True)
            else:
                print("   MISSING: BioDockify-pharma-research-ai/desktop/tauri/src-tauri/tauri.conf.json")
                print("      Expected: BioDockify - Pharma Research AI")
                results.append(False)
    except Exception as e:
        print(f"   ERROR: {e}")
        results.append(False)
    
    # Summary
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\nSUCCESS: All version and title updates verified!")
        return 0
    else:
        print(f"\nFAILED: {total - passed} check(s) failed")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
