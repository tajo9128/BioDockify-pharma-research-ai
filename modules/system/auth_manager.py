import os
import logging
from typing import Dict, Any, Optional, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env in case it wasn't loaded by server.py
load_dotenv()

logger = logging.getLogger("biodockify_api")

class AuthManager:
    """
    Handles user verification against Supabase.
    Simplified Mode: Verifies Name + Email match a record in 'users' table.
    """
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")  # Anon Key
        self.client: Optional[Client] = None
        
        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
        else:
            logger.warning("Supabase credentials not found in environment variables.")


    async def verify_user(self, name: str, email: str, offline_token: str = None) -> Tuple[bool, str]:
        """
        Check if user exists in Supabase.
        Returns: (success, message_or_token)
        """
        # 0. Check Offline/Emergency Token first (Fastest path if provided)
        if offline_token:
            from modules.system.emergency_access import validate_emergency_token
            if validate_emergency_token(email, offline_token):
                return True, "Emergency Access Granted"

        if not self.client:
            # Even if Supabase client in AuthManager is down, LicenseGuard might have its own or cache
            # But LicenseGuard also needs connectivity or cache.
            # We'll proceed to try LicenseGuard.
            pass
            
        try:
            # Use LicenseGuard which handles 'profiles' table, cache, and correct logic
            from modules.security.license_guard import license_guard
            
            # verify expects (email, force_online)
            # We don't force online unless requested, but for First Run, maybe we should?
            # Default behavior is fine (checks monthly). 
            # If user is stuck, they might be offline, so cache is good.
            
            is_valid, message = await license_guard.verify(email)
            
            if is_valid:
                logger.info(f"License Verified for: {email}")
                return True, message
            else:
                return False, message
                
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return False, f"Verification Error: {str(e)}"

# Singleton instance
auth_manager = AuthManager()
