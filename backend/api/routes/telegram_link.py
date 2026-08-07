"""
api/routes/telegram_link.py — Telegram account linking endpoints.

Flow:
  1. User logs into the web console (Supabase auth).
  2. They click "Link Telegram" → backend generates a one-time 6-digit code,
     stored in the profiles table with a 10-minute expiry.
  3. User sends /link <code> to the Telegram bot.
  4. Bot calls POST /api/v1/telegram/confirm with the code + chat_id.
  5. Backend verifies the code and writes the chat_id to profiles.telegram_chat_id.
  6. Future bot messages from that chat_id are now linked to the Supabase user.
"""

import os
import logging
import secrets
import string
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.routes.auth import get_current_user, UserProfile, get_supabase

logger = logging.getLogger("TelegramLink")

router = APIRouter(prefix="/telegram", tags=["Telegram"])

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class LinkCodeResponse(BaseModel):
    link_code: str
    expires_in_seconds: int


class ConfirmLinkRequest(BaseModel):
    link_code: str
    telegram_chat_id: str
    telegram_username: Optional[str] = None
    # This endpoint is called by the bot (server-to-server). We protect it
    # with an internal secret instead of a user JWT so the bot process can
    # call it without a user session.
    bot_secret: str


class LinkStatusResponse(BaseModel):
    is_linked: bool
    telegram_chat_id: Optional[str] = None
    telegram_username: Optional[str] = None


class UnlinkResponse(BaseModel):
    success: bool
    message: str


# ---------------------------------------------------------------------------
# Helper — generate a human-friendly 6-digit numeric code
# ---------------------------------------------------------------------------
def _generate_link_code() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate-link-code", response_model=LinkCodeResponse)
def generate_link_code(user: UserProfile = Depends(get_current_user)):
    """
    Generates a one-time 6-digit code for the authenticated web user.
    The user sends this code to the Telegram bot via /link <code>.
    """
    code = _generate_link_code()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    try:
        sb = get_supabase()
        sb.table("profiles").update(
            {
                "telegram_link_code": code,
                "telegram_link_code_expires_at": expires_at,
            }
        ).eq("id", user.user_id).execute()
    except Exception as exc:
        logger.error("Failed to store link code for user %s: %s", user.user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate link code. Please try again.",
        )

    return LinkCodeResponse(link_code=code, expires_in_seconds=600)


@router.post("/confirm-link")
def confirm_link(request: ConfirmLinkRequest):
    """
    Called by the Telegram bot when a user sends /link <code>.
    Protected by BOT_INTERNAL_SECRET env var (not user JWT) so the bot
    process can call this endpoint without a user session.
    """
    bot_secret = os.getenv("BOT_INTERNAL_SECRET", "")
    if not bot_secret or request.bot_secret != bot_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid bot secret.",
        )

    try:
        sb = get_supabase()
        now = datetime.now(timezone.utc)

        # Find profile with this link code that hasn't expired
        result = (
            sb.table("profiles")
            .select("id, telegram_link_code_expires_at")
            .eq("telegram_link_code", request.link_code)
            .execute()
        )

        rows = result.data or []
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid link code. Please generate a new one from the web console.",
            )

        profile = rows[0]
        expires_str = profile.get("telegram_link_code_expires_at")

        # Validate expiry
        if expires_str:
            expires_at = datetime.fromisoformat(expires_str)
            if now > expires_at:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Link code has expired. Please generate a new one.",
                )

        # Write telegram_chat_id and clear the one-time code
        sb.table("profiles").update(
            {
                "telegram_chat_id": str(request.telegram_chat_id),
                "telegram_username": request.telegram_username,
                "telegram_link_code": None,
                "telegram_link_code_expires_at": None,
            }
        ).eq("id", profile["id"]).execute()

        logger.info(
            "Telegram chat_id %s linked to profile %s", request.telegram_chat_id, profile["id"]
        )
        return {"success": True, "message": "Telegram account linked successfully."}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error confirming link: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error while linking account.",
        )


@router.get("/link-status", response_model=LinkStatusResponse)
def get_link_status(user: UserProfile = Depends(get_current_user)):
    """Returns whether the current user has linked their Telegram account."""
    try:
        sb = get_supabase()
        result = (
            sb.table("profiles")
            .select("telegram_chat_id, telegram_username")
            .eq("id", user.user_id)
            .single()
            .execute()
        )
        data = result.data or {}
        chat_id = data.get("telegram_chat_id")
        return LinkStatusResponse(
            is_linked=bool(chat_id),
            telegram_chat_id=chat_id,
            telegram_username=data.get("telegram_username"),
        )
    except Exception as exc:
        logger.error("Error fetching link status for user %s: %s", user.user_id, exc)
        return LinkStatusResponse(is_linked=False)


@router.delete("/unlink", response_model=UnlinkResponse)
def unlink_telegram(user: UserProfile = Depends(get_current_user)):
    """Removes the Telegram link for the current user."""
    try:
        sb = get_supabase()
        sb.table("profiles").update(
            {
                "telegram_chat_id": None,
                "telegram_username": None,
            }
        ).eq("id", user.user_id).execute()
        return UnlinkResponse(success=True, message="Telegram account unlinked.")
    except Exception as exc:
        logger.error("Error unlinking telegram for user %s: %s", user.user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not unlink account.",
        )
