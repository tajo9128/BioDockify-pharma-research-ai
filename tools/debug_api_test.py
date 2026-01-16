
import requests
from unittest.mock import patch, Mock

def test_google_logic(key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    print(f"Testing Google URL: {url}")
    # Simulating request not actually running it
    return True

def test_custom_logic(base_url, key):
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    # Method 1
    models_url = f"{base_url.rstrip('/')}/models"
    print(f"Testing Custom Models URL: {models_url}")
    return True

print("Checking Logic...")
test_google_logic("dummy_key")
test_custom_logic("https://site.com/v1", "dummy_key")
