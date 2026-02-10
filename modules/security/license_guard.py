"""
License Guard Module
Validates license against Supabase (via internet).
Free license valid for 1 year from signup date stored in Supabase.
Checks are performed monthly (every 30 days).
"""

import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from runtime.robust_connection import async_with_retry

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    logger.warning("SUPABASE_URL or SUPABASE_KEY missing. License verification may fail.")

# License duration: 1 year from signup
LICENSE_DURATION_DAYS = 365

# Check interval: Monthly (every 30 days)
LICENSE_CHECK_INTERVAL_DAYS = 30


def get_cache_path() -> Path:
    """Get the path to the local license cache."""
    app_data = os.environ.get('APPDATA', os.path.expanduser('~'))
    cache_dir = Path(app_data) / 'BioDockify'
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir / 'license_cache.json'


class LicenseGuard:
    """
    Validates software license against Supabase (internet required).
    
    - Checks user's registration date in Supabase 'users' table
    - License valid for 1 year from registration date
    - Caches result locally for offline grace period (7 days)
    """
    
    OFFLINE_GRACE_DAYS = 7
    
    def __init__(self):
        self.cache_path = get_cache_path()
        self.cache: Dict[str, Any] = {}
        self._load_cache()
    
    def _load_cache(self):
        """Load cached license data."""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r') as f:
                    self.cache = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load license cache: {e}")
                self.cache = {}
    
    def _save_cache(self):
        """Save license cache."""
        try:
            with open(self.cache_path, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save license cache: {e}")
    
    @async_with_retry(max_retries=2, base_delay=2, circuit_name="supabase_license")
    async def check_license_online(self, email: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Check license against Supabase over internet.
        
        Returns:
            (is_valid, message, user_data)
        """
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}&select=email,created_at"
                headers = {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                    'Content-Type': 'application/json'
                }
                
                async with session.get(url, headers=headers, timeout=10) as response:
                    if response.status != 200:
                        return False, "Unable to verify license (server error)", None
                    
                    data = await response.json()
                    
                    if not data or len(data) == 0:
                        return False, "Email not registered. Please sign up at biodockify.com", None
                    
                    user = data[0]
                    
                    # Check license expiry
                    if 'license_expiry' in user and user['license_expiry']:
                        expiry = datetime.fromisoformat(user['license_expiry'].replace('Z', '+00:00'))
                    else:
                        # Calculate from created_at + 1 year (signup date + 365 days)
                        created = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00'))
                        expiry = created + timedelta(days=LICENSE_DURATION_DAYS)
                    
                    now = datetime.now(expiry.tzinfo) if expiry.tzinfo else datetime.now()
                    expiry_date_str = expiry.strftime('%B %d, %Y')  # e.g., "January 30, 2027"
                    
                    if now > expiry:
                        days_expired = (now - expiry).days
                        return False, f"License expired on {expiry_date_str} ({days_expired} days ago). Renew at biodockify.com", user
                    
                    days_remaining = (expiry - now).days
                    return True, f"License valid until {expiry_date_str} ({days_remaining} days remaining)", user
                    
        except Exception as e:
            logger.error(f"Online license check failed: {e}")
            return False, f"Network error: {str(e)}", None
    
    def check_license_cached(self, email: str) -> Tuple[bool, str]:
        """
        Check cached license (for offline use).
        
        Returns:
            (is_valid, message)
        """
        if not self.cache:
            return False, "No cached license. Internet required for verification."
        
        cached_email = self.cache.get('email')
        if cached_email != email:
            return False, "Cached license for different user"
        
        # Check if cache is still within grace period
        last_check = self.cache.get('last_online_check')
        if last_check:
            last_check_date = datetime.fromisoformat(last_check)
            days_since_check = (datetime.now() - last_check_date).days
            
            if days_since_check > self.OFFLINE_GRACE_DAYS:
                return False, f"Offline grace period expired. Connect to internet to verify license."
        
        # Check cached expiry
        expiry_str = self.cache.get('expiry_date')
        if expiry_str:
            expiry = datetime.fromisoformat(expiry_str)
            expiry_date_str = expiry.strftime('%B %d, %Y')
            if datetime.now() > expiry:
                return False, f"License expired on {expiry_date_str}"
            
            days_remaining = (expiry - datetime.now()).days
            return True, f"License valid until {expiry_date_str} ({days_remaining} days remaining)"
        
        return False, "Invalid cache data"
    
    def _should_check_online(self, email: str) -> bool:
        """Determine if we need to check online (monthly interval)."""
        if not self.cache:
            return True
        
        cached_email = self.cache.get('email')
        if cached_email != email:
            return True  # Different user, need fresh check
        
        last_check = self.cache.get('last_online_check')
        if not last_check:
            return True
        
        try:
            last_check_date = datetime.fromisoformat(last_check)
            days_since_check = (datetime.now() - last_check_date).days
            return days_since_check >= LICENSE_CHECK_INTERVAL_DAYS  # Monthly check
        except Exception:
            return True
    
    async def verify(self, email: str, force_online: bool = False) -> Tuple[bool, str]:
        """
        Verify license - checks online monthly, uses cache otherwise.
        
        Args:
            email: User's registered email
            force_online: Force online check even if cache is valid
            
        Returns:
            (is_valid, message)
        """
        if not email:
            return False, "Email required for verification"
        
        # Check if we need to verify online (monthly)
        need_online_check = force_online or self._should_check_online(email)
        
        if not need_online_check:
            # Use cached license (checked within last 30 days)
            cache_valid, cache_msg = self.check_license_cached(email)
            if cache_valid:
                days_since = 0
                last_check = self.cache.get('last_online_check')
                if last_check:
                    days_since = (datetime.now() - datetime.fromisoformat(last_check)).days
                return True, f"{cache_msg} (next check in {LICENSE_CHECK_INTERVAL_DAYS - days_since} days)"
        
        # Monthly check or first run - verify online
        is_valid, message, user_data = await self.check_license_online(email)
        
        if user_data:
            # Update cache with online data
            self.cache = {
                'email': email,
                'last_online_check': datetime.now().isoformat(),
                'is_valid': is_valid,
                'user_data': user_data
            }
            
            # Calculate expiry for cache (1 year from signup)
            if 'license_expiry' in user_data and user_data['license_expiry']:
                self.cache['expiry_date'] = user_data['license_expiry']
            elif 'created_at' in user_data:
                created = datetime.fromisoformat(user_data['created_at'].replace('Z', '+00:00'))
                expiry = created + timedelta(days=LICENSE_DURATION_DAYS)
                self.cache['expiry_date'] = expiry.isoformat()
            
            self._save_cache()
            logger.info(f"License verified: {email} - valid={is_valid}")
            return is_valid, message
        
        # Online failed, try cached if network error
        if "Network error" in message or "Unable to verify" in message:
            cache_valid, cache_msg = self.check_license_cached(email)
            if cache_valid:
                return True, f"{cache_msg} (offline mode)"
        
        return is_valid, message
    
    def get_cached_info(self) -> Dict[str, Any]:
        """Get cached license information."""
        return {
            'email': self.cache.get('email'),
            'is_valid': self.cache.get('is_valid', False),
            'expiry_date': self.cache.get('expiry_date'),
            'last_check': self.cache.get('last_online_check'),
            'offline_grace_days': self.OFFLINE_GRACE_DAYS
        }


# Singleton instance
license_guard = LicenseGuard()


async def check_license(email: str) -> Tuple[bool, str]:
    """Convenience function to check license."""
    return await license_guard.verify(email)
