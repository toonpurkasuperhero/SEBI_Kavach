"""
telegram_bot.py — SEBI Kavach Telegram Bot
Runs as a separate process alongside the FastAPI server (via Procfile).

New features:
  - /link <code>  → link Telegram account to a web console user
  - /unlink       → remove account link
  - /status       → show whether account is linked
  - All media analyses are stored per linked user in Supabase scan_history table
  - Unlinked users can still use the bot (anonymous mode)
"""

import os
import asyncio
import io
import logging
import httpx
from typing import Optional
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("TelegramBot")

# Import internal modules
try:
    from phash_registry import phash_registry
    from model_runner import analyze_image_frame, analyze_audio_clip, analyze_text_phishing
except ImportError:
    try:
        from backend.phash_registry import phash_registry
        from backend.model_runner import analyze_image_frame, analyze_audio_clip, analyze_text_phishing
    except ImportError:
        import sys
        from pathlib import Path
        sys.path.append(str(Path(__file__).parent.resolve()))
        from phash_registry import phash_registry
        from model_runner import analyze_image_frame, analyze_audio_clip, analyze_text_phishing

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()

# Internal API base URL (same Railway service)
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
BOT_INTERNAL_SECRET = os.getenv("BOT_INTERNAL_SECRET", "")

# Supabase (for storing scan history per user)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_supabase_client = None

def get_supabase():
    global _supabase_client
    if _supabase_client is None and SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        try:
            from supabase import create_client
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        except Exception as e:
            logger.error("Could not init Supabase client: %s", e)
    return _supabase_client


def store_scan_history(telegram_chat_id: str, scan_type: str, result: dict, input_summary: str):
    """Stores a scan result to Supabase scan_history for the linked user."""
    try:
        sb = get_supabase()
        if not sb:
            return

        # Find profile linked to this chat_id
        profile_result = (
            sb.table("profiles")
            .select("id")
            .eq("telegram_chat_id", str(telegram_chat_id))
            .execute()
        )
        rows = profile_result.data or []
        if not rows:
            return  # unlinked user — don't store

        profile_id = rows[0]["id"]
        sb.table("scan_history").insert(
            {
                "user_id": profile_id,
                "scan_type": scan_type,
                "risk_level": result.get("risk_level", "unknown"),
                "confidence_score": result.get("confidence_score", 0.0),
                "trust_category": result.get("trust_category", ""),
                "is_synthetic": result.get("is_synthetic", False),
                "input_summary": input_summary[:500],
                "explanation": result.get("explanation", "")[:1000],
            }
        ).execute()
    except Exception as exc:
        logger.warning("Could not store scan history: %s", exc)


def create_telegram_bot_app():
    """Initializes python-telegram-bot application."""
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "your_token_here":
        logger.warning("[Telegram Bot] TELEGRAM_BOT_TOKEN not configured.")
        return None

    try:
        from telegram import Update
        from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

        # ---------------------------------------------------------------
        # /start
        # ---------------------------------------------------------------
        async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            welcome_text = (
                "🛡️ *SEBI Kavach Official Verification Bot*\n\n"
                "Namaste! 🙏 Welcome to SEBI Kavach.\n\n"
                "Is any stock tip, voice call, or SEBI notice making you suspicious?\n"
                "*Just forward it to me right here!*\n\n"
                "🔍 *What you can forward:*\n"
                "• Stock tip or WhatsApp message link\n"
                "• Voice note or recorded phone call\n"
                "• Photo of SEBI circular or screenshot\n\n"
                "🔗 *Link your account:*\n"
                "Register at our web console and use /link <code> to track your scan history.\n\n"
                "⚡ I will instantly check if it is *ASLI (Genuine)* or *NAKLI (Fake Deepfake)*."
            )
            await update.message.reply_text(welcome_text, parse_mode="Markdown")

        # ---------------------------------------------------------------
        # /help
        # ---------------------------------------------------------------
        async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            help_text = (
                "📖 *Simple Meaning of Colors:*\n\n"
                "🟢 *ASLI / VERIFIED*: 100% Genuine.\n\n"
                "🟡 *CHECK CAREFULLY*: No fake AI detected, but unregistered origin.\n\n"
                "🟧 *UNDER REVIEW*: Being checked by SEBI officers.\n\n"
                "🚨 *NAKLI / SCAM ALERT*: Fake AI Deepfake or Scam! Do NOT transfer money!\n\n"
                "📋 *Commands:*\n"
                "/link <6-digit-code> — Link to your web console account\n"
                "/unlink — Remove account link\n"
                "/status — Check if your account is linked"
            )
            await update.message.reply_text(help_text, parse_mode="Markdown")

        # ---------------------------------------------------------------
        # /link <code>
        # ---------------------------------------------------------------
        async def link_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            args = context.args or []
            if not args:
                await update.message.reply_text(
                    "⚠️ Usage: /link <6-digit-code>\n\n"
                    "Get your code from the SEBI Kavach web console → Account Settings → Link Telegram."
                )
                return

            code = args[0].strip()
            chat_id = str(update.effective_chat.id)
            username = update.effective_user.username if update.effective_user else None

            status_msg = await update.message.reply_text("🔗 Linking your account…")

            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(
                        f"{BACKEND_BASE_URL}/api/v1/telegram/confirm-link",
                        json={
                            "link_code": code,
                            "telegram_chat_id": chat_id,
                            "telegram_username": username,
                            "bot_secret": BOT_INTERNAL_SECRET,
                        },
                    )

                if resp.status_code == 200:
                    await status_msg.edit_text(
                        "✅ *Account linked successfully!*\n\n"
                        "Your scan history will now be saved to your SEBI Kavach console.",
                        parse_mode="Markdown",
                    )
                elif resp.status_code == 404:
                    await status_msg.edit_text(
                        "❌ Invalid code. Please generate a new code from the web console.",
                    )
                elif resp.status_code == 400:
                    await status_msg.edit_text(
                        "❌ Code has expired. Please generate a new 6-digit code from the web console.",
                    )
                else:
                    await status_msg.edit_text(
                        "❌ Could not link account. Please try again in a moment.",
                    )
            except Exception as exc:
                logger.error("Link command error: %s", exc)
                await status_msg.edit_text(
                    "❌ Service temporarily unavailable. Please try again shortly.",
                )

        # ---------------------------------------------------------------
        # /unlink
        # ---------------------------------------------------------------
        async def unlink_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            chat_id = str(update.effective_chat.id)
            try:
                sb = get_supabase()
                if sb:
                    sb.table("profiles").update(
                        {"telegram_chat_id": None, "telegram_username": None}
                    ).eq("telegram_chat_id", chat_id).execute()
                await update.message.reply_text(
                    "✅ Your Telegram account has been unlinked from the web console.\n"
                    "You can still use the bot anonymously."
                )
            except Exception as exc:
                logger.error("Unlink error: %s", exc)
                await update.message.reply_text("❌ Could not unlink. Please try again.")

        # ---------------------------------------------------------------
        # /status
        # ---------------------------------------------------------------
        async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            chat_id = str(update.effective_chat.id)
            try:
                sb = get_supabase()
                if not sb:
                    await update.message.reply_text("🔗 Account linking unavailable (service config missing).")
                    return

                result = (
                    sb.table("profiles")
                    .select("email, telegram_username")
                    .eq("telegram_chat_id", chat_id)
                    .execute()
                )
                rows = result.data or []
                if rows:
                    email = rows[0].get("email", "")
                    await update.message.reply_text(
                        f"✅ *Account Linked*\n\nLinked to: `{email}`",
                        parse_mode="Markdown",
                    )
                else:
                    await update.message.reply_text(
                        "❌ *Not Linked*\n\n"
                        "Use /link <code> to connect this bot to your web console account.\n"
                        "Get the code from: Account Settings → Link Telegram.",
                        parse_mode="Markdown",
                    )
            except Exception as exc:
                logger.error("Status command error: %s", exc)
                await update.message.reply_text("❌ Could not check status. Please try again.")

        # ---------------------------------------------------------------
        # Text messages
        # ---------------------------------------------------------------
        async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
            user_text = update.message.text
            chat_id = str(update.effective_chat.id)
            status_msg = await update.message.reply_text(
                "⚡ *Checking message... Please wait...*", parse_mode="Markdown"
            )

            res = analyze_text_phishing(user_text)
            is_scam = res["risk_level"] == "high"
            is_review = res.get("trust_category") == "UNDER_REVIEW"

            if is_scam:
                verdict_card = (
                    "🚨 *SAAVDHAN / SCAM ALERT! (NAKLI MESSAGE)*\n\n"
                    "❌ *Warning:* This message matches known stock tip scams or fake SEBI notices.\n\n"
                    "• *Reason:* Promises guaranteed high profits or urgent account freezing.\n"
                    "• *Action Required:* Do NOT transfer money. Do NOT share OTP or demat details.\n\n"
                    "📢 *Report to SEBI SCORES portal if you lost money.*"
                )
            elif is_review:
                verdict_card = (
                    "🟧 *DHYAN DEIN: UNDER SEBI REVIEW*\n\n"
                    "⚠️ *Notice:* This message mentions market claims being verified.\n\n"
                    "• *Action:* Wait for official news on NSE/BSE website before trading."
                )
            else:
                verdict_card = (
                    "🟡 *NORMAL MESSAGE (UNREGISTERED ORIGIN)*\n\n"
                    "✅ No obvious scam patterns found in text.\n"
                    "⚠️ *Reminder: Always trade through SEBI Registered Brokers only.*"
                )

            await status_msg.edit_text(verdict_card, parse_mode="Markdown")
            store_scan_history(chat_id, "text", res, user_text[:200])

        # ---------------------------------------------------------------
        # Photo messages
        # ---------------------------------------------------------------
        async def handle_photo_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
            chat_id = str(update.effective_chat.id)
            status_msg = await update.message.reply_text(
                "⚡ *Checking document against Official SEBI Registry...*",
                parse_mode="Markdown",
            )

            try:
                photo_file = await update.message.photo[-1].get_file()
                photo_bytes = await photo_file.download_as_bytearray()
                image = Image.open(io.BytesIO(photo_bytes)).convert("RGB")

                # Tier 1: pHash check
                matched, signer, title, dist = phash_registry.match_media(image)
                if matched:
                    verdict_card = (
                        "✅ *ASLI (100% VERIFIED OFFICIAL DOCUMENT)*\n\n"
                        f"• *Signed By:* {signer}\n"
                        f"• *Notice Title:* {title}\n"
                        "• *Status:* Verified genuine by SEBI Kavach Registry.\n\n"
                        "👍 You can safely trust this document."
                    )
                    await status_msg.edit_text(verdict_card, parse_mode="Markdown")
                    store_scan_history(chat_id, "image", {"risk_level": "low", "confidence_score": 0.99, "trust_category": "VERIFIED", "is_synthetic": False, "explanation": f"pHash match: {signer}"}, "photo")
                    return

                # Tier 2: HF AI scan
                await status_msg.edit_text(
                    "🧠 *Running AI Deepfake Vision Scan...*", parse_mode="Markdown"
                )
                res = analyze_image_frame(image)
                is_fake = res["is_synthetic"]

                if is_fake:
                    verdict_card = (
                        "🚨 *NAKLI PHOTO / DEEPFAKE ALERT!*\n\n"
                        "❌ *Warning:* AI detected this photo has been edited or generated using AI.\n\n"
                        f"• *Confidence:* {res['confidence_score']*100:.0f}%\n"
                        "• *Recommendation:* Do NOT follow instructions in this image."
                    )
                else:
                    verdict_card = (
                        "🟡 *CHECK CAREFULLY (UNREGISTERED MEDIA)*\n\n"
                        "ℹ️ No fake AI artifacts detected, but no official SEBI signature found.\n\n"
                        "• *Advice:* Verify on sebi.gov.in before acting."
                    )

                await status_msg.edit_text(verdict_card, parse_mode="Markdown")
                store_scan_history(chat_id, "image", res, "photo")

            except Exception as exc:
                logger.error("Error processing photo: %s", exc)
                await status_msg.edit_text("❌ Could not read photo. Please send a clearer image.")

        # ---------------------------------------------------------------
        # Voice/Audio messages
        # ---------------------------------------------------------------
        async def handle_voice_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
            chat_id = str(update.effective_chat.id)
            status_msg = await update.message.reply_text(
                "⚡ *Voice note received. Checking AI Voice Cloning...*",
                parse_mode="Markdown",
            )

            try:
                voice_obj = update.message.voice or update.message.audio
                voice_file = await voice_obj.get_file()

                temp_audio_path = f"temp_voice_{chat_id}.ogg"
                await voice_file.download_to_drive(temp_audio_path)

                await status_msg.edit_text(
                    "🧠 *Analyzing human voice pitch & computer synthesis...*",
                    parse_mode="Markdown",
                )

                res = analyze_audio_clip(temp_audio_path)
                is_fake = res["is_synthetic"]

                import os as _os
                if _os.path.exists(temp_audio_path):
                    _os.remove(temp_audio_path)

                if is_fake:
                    verdict_card = (
                        "🚨 *NAKLI AAWAZ / FAKE VOICE CLONE ALERT!*\n\n"
                        "❌ *Warning:* This voice note was created by a computer AI model.\n\n"
                        f"• *Confidence:* {res['confidence_score']*100:.0f}%\n"
                        "• *Danger:* Scammers use AI to clone voices of CEOs or SEBI officers.\n"
                        "• *Action:* Block this contact. Never share OTP or transfer money!"
                    )
                else:
                    verdict_card = (
                        "🟢 *NATURAL HUMAN VOICE*\n\n"
                        "✅ Voice pitch aligns with natural human vocal patterns.\n\n"
                        "• *Reminder:* Never share OTPs or passwords with anyone over call."
                    )

                await status_msg.edit_text(verdict_card, parse_mode="Markdown")
                store_scan_history(chat_id, "audio", res, "voice_note")

            except Exception as exc:
                logger.error("Error processing voice: %s", exc)
                await status_msg.edit_text("❌ Could not process voice clip. Please try again.")

        # ---------------------------------------------------------------
        # Build app
        # ---------------------------------------------------------------
        app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(CommandHandler("help", help_command))
        app.add_handler(CommandHandler("link", link_command))
        app.add_handler(CommandHandler("unlink", unlink_command))
        app.add_handler(CommandHandler("status", status_command))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_message))
        app.add_handler(MessageHandler(filters.PHOTO, handle_photo_message))
        app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, handle_voice_message))

        return app

    except Exception as exc:
        logger.error("[Telegram Bot] Initialization error: %s", exc)
        return None


def start_telegram_bot_polling():
    app = create_telegram_bot_app()
    if app:
        logger.info("[Telegram Bot] Starting polling loop...")
        app.run_polling()
    else:
        logger.info("[Telegram Bot] Bot polling skipped (missing TELEGRAM_BOT_TOKEN).")


async def start_telegram_bot_async():
    app = create_telegram_bot_app()
    if app:
        try:
            logger.info("[Telegram Bot] Initializing and starting async bot polling...")
            await app.initialize()
            await app.start()
            await app.updater.start_polling()
        except Exception as exc:
            logger.error("[Telegram Bot] Async start error: %s", exc)
    else:
        logger.info("[Telegram Bot] Bot async start skipped (missing TELEGRAM_BOT_TOKEN).")


if __name__ == "__main__":
    start_telegram_bot_polling()
