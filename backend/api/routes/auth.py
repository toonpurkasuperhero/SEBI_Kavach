"""
api/routes/auth.py — Supabase JWT authentication middleware for SEBI Kavach.

Provides:
  - get_current_user()  dependency: validates Bearer JWT from Supabase
  - require_admin()     dependency: same + checks role == 'admin'
  - /auth/me GET        endpoint: returns current user profile
"""

import os
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from jose import jwt, JWTError
from supabase import create_client, Client

logger = logging.getLogger("Auth")

# ---------------------------------------------------------------------------
# Supabase client (singleton)
# ---------------------------------------------------------------------------
_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")  # service role for server-side ops
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment."
            )
        _supabase_client = create_client(url, key)
    return _supabase_client


# ---------------------------------------------------------------------------
# JWT verification
# ---------------------------------------------------------------------------
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

security = HTTPBearer(auto_error=False)


class UserProfile(BaseModel):
    user_id: str
    email: str
    role: str = "investor"
    telegram_chat_id: Optional[str] = None


def _decode_jwt(token: str) -> dict:
    """Decode and verify a Supabase-issued JWT using the project JWT secret."""
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfiguration: SUPABASE_JWT_SECRET not set.",
        )
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase uses 'authenticated' audience
        )
        return payload
    except JWTError as exc:
        logger.warning("JWT decode failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> UserProfile:
    """
    FastAPI dependency: validates Bearer JWT and returns the user profile.
    Raises 401 if token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = _decode_jwt(credentials.credentials)
    user_id: str = payload.get("sub", "")
    email: str = payload.get("email", "")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user ID.",
        )

    # Fetch role + telegram_chat_id from profiles table
    try:
        sb = get_supabase()
        result = (
            sb.table("profiles")
            .select("role, telegram_chat_id")
            .eq("id", user_id)
            .single()
            .execute()
        )
        profile_data = result.data or {}
        role = profile_data.get("role", "investor")
        telegram_chat_id = profile_data.get("telegram_chat_id")
    except Exception as exc:
        logger.error("Could not fetch profile for user %s: %s", user_id, exc)
        role = "investor"
        telegram_chat_id = None

    return UserProfile(
        user_id=user_id,
        email=email,
        role=role,
        telegram_chat_id=telegram_chat_id,
    )


def require_admin(user: UserProfile = Depends(get_current_user)) -> UserProfile:
    """Dependency: ensures the current user has admin role."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", response_model=UserProfile)
def get_me(user: UserProfile = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return user
