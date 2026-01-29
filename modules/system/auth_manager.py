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

    async def verify_user(self, name: str, email: str) -> Tuple[bool, str]:
        """
        Check if user exists in Supabase.
        Returns: (success, message_or_token)
        """
        if not self.client:
            return False, "Validation service unavailable (Server Config Error)"
            
        try:
            # Query the 'users' table
            # Assuming table 'users' has 'name' and 'email' columns
            # Using partial matching for name to be forgiving, or exact? 
            # Request asked: "If they both present on database unlock it" -> Implies exact match logic usually.
            
            # Note: RLS might block listing all users. 
            # If RLS is on, we might need Service Role Key or specific policy.
            # Using Anon key for now as requested.
            
            response = self.client.table("users").select("*").eq("email", email).execute()
            
            # Check if any record was found
            if response.data and len(response.data) > 0:
                # Email matches -> Success (Name check removed as per v2.18.2 requirements)
                logger.info(f"License Verified for: {email}")
                return True, "License Verified"
            else:
                return False, "Email not found in registry."
                
        except Exception as e:
            logger.error(f"Supabase verification failed: {e}")
            return False, f"Verification Error: {str(e)}"

# Singleton instance
auth_manager = AuthManager()
