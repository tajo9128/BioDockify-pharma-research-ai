import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class BackupCrypto:
    def __init__(self, password: str = None, key_path: str = "backup_key.key"):
        """
        Initialize crypto with a password or load/generate a key file.
        In a real scenario, use a secure vault. For this implementation, we use a local key or password derivation.
        """
        self.key = self._load_or_generate_key(password, key_path)
        self.cipher = Fernet(self.key)

    def _load_or_generate_key(self, password: str, key_path: str) -> bytes:
        if password:
            # Derive key from password
            salt = b'biodockify_salt_static' # In prod, store random salt
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            return base64.urlsafe_b64encode(kdf.derive(password.encode()))
        
        if os.path.exists(key_path):
            with open(key_path, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(key_path, 'wb') as f:
                f.write(key)
            return key

    def encrypt_file(self, file_path: str, output_path: str):
        """Encrypts a file and saves it to output_path."""
        with open(file_path, 'rb') as f:
            data = f.read()
        encrypted = self.cipher.encrypt(data)
        with open(output_path, 'wb') as f:
            f.write(encrypted)

    def decrypt_file(self, file_path: str, output_path: str):
        """Decrypts a file and saves it to output_path."""
        with open(file_path, 'rb') as f:
            data = f.read()
        decrypted = self.cipher.decrypt(data)
        with open(output_path, 'wb') as f:
            f.write(decrypted)
