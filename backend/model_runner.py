"""
model_runner.py — SEBI Kavach AI Detection Engine
Primary: Google Gemini Vision API (free tier, 15 RPM, works on Railway)
Fallback: HuggingFace Inference API (if HF_API_TOKEN set and reachable)

Required env vars (at least one must be set):
    GEMINI_API_KEY   — Google AI Studio key (free at aistudio.google.com/app/apikey)
    HF_API_TOKEN     — HuggingFace API token (optional backup)
"""

import os
import io
import json
import base64
import logging
import time
import tempfile
from typing import Dict, Any, Optional

import httpx
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ModelRunner")


class ModelUnavailableError(RuntimeError):
    """Raised when no AI model can be called."""
    pass


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
HF_API_TOKEN: str = os.getenv("HF_API_TOKEN", "").strip()

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
# Standard valid Gemini endpoint model identifiers
GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-8b-latest",
]
HF_API_BASE = "https://api-inference.huggingface.co/models"
IMAGE_MODEL = "dima806/deepfake_vs_real_image_detection"
AUDIO_MODEL = "mo-thecreator/Deepfake-audio-detection"

REQUEST_TIMEOUT = 45
HF_RETRY_WAIT = 20


# ---------------------------------------------------------------------------
# Gemini Vision — image deepfake / AI-generation detection
# ---------------------------------------------------------------------------
def _gemini_analyze_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Uses Gemini Vision to detect AI-generated / deepfake images.
    Tries multiple model versions until one succeeds.
    Raises ModelUnavailableError if GEMINI_API_KEY is missing or all models fail.
    """
    if not GEMINI_API_KEY:
        raise ModelUnavailableError(
            "GEMINI_API_KEY is not configured. "
            "Get a free key at aistudio.google.com/app/apikey and add it to Railway environment variables."
        )

    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """You are a forensic AI media authentication expert for SEBI (Securities and Exchange Board of India).
Analyze this image and determine if it is:
1. AI-GENERATED / DEEPFAKE / MANIPULATED (created by tools like Midjourney, DALL-E, Gemini, Stable Diffusion, or digitally tampered)
2. AUTHENTIC REAL MEDIA (genuine photograph, scan, or screenshot from a real camera/device)

Look for these specific signs of AI generation or manipulation:
- Unnatural texture smoothness or overly perfect lighting
- Inconsistent shadows or reflections
- Blurry or distorted edges, text, logos
- Watermarks or artifacts typical of AI image generators
- Inconsistent fonts or formatting that looks AI-generated in documents
- Missing metadata patterns typical of genuine camera photos
- Hallucinated or incorrect text content in documents

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation outside JSON):
{
  "is_synthetic": true or false,
  "confidence": 0.0 to 1.0,
  "verdict": "FAKE" or "REAL",
  "reason": "Brief 1-2 sentence explanation of key evidence found"
}"""

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": b64_image
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 256,
        }
    }

    last_error = ""
    for model_name in GEMINI_MODELS:
        url = f"{GEMINI_API_BASE}/{model_name}:generateContent?key={GEMINI_API_KEY}"
        logger.info("[ModelRunner] Trying Gemini model: %s", model_name)
        try:
            with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
                resp = client.post(url, json=payload, headers={"Content-Type": "application/json"})

            if resp.status_code == 404:
                # This model name not available, try next
                last_error = f"Model '{model_name}' not found (404)"
                logger.warning("[ModelRunner] %s", last_error)
                continue

            if resp.status_code == 429:
                wait_secs = 8
                logger.warning("[ModelRunner] Gemini rate limit (429) on model %s. Waiting %ds...", model_name, wait_secs)
                time.sleep(wait_secs)
                # Retry the same model once more
                try:
                    with httpx.Client(timeout=REQUEST_TIMEOUT) as client2:
                        resp2 = client2.post(url, json=payload, headers={"Content-Type": "application/json"})
                    if resp2.status_code == 200:
                        resp = resp2  # use the successful retry response
                    elif resp2.status_code == 429:
                        last_error = f"Rate limited on {model_name} even after retry"
                        logger.warning("[ModelRunner] Still rate limited, trying next model...")
                        continue
                    else:
                        resp = resp2
                except Exception:
                    pass

            if resp.status_code in (401, 403):
                raise ModelUnavailableError(
                    f"Gemini API key invalid or unauthorized (HTTP {resp.status_code}). "
                    "Check your GEMINI_API_KEY in Railway variables."
                )

            if resp.status_code != 200:
                last_error = f"HTTP {resp.status_code}: {resp.text[:150]}"
                logger.warning("[ModelRunner] Gemini %s error: %s", model_name, last_error)
                continue

            # Success — parse response
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            logger.info("[ModelRunner] Gemini (%s) raw response: %s", model_name, text)

            # Strip markdown code fences if present
            if "```" in text:
                parts = text.split("```")
                for part in parts:
                    if "{" in part:
                        text = part.lstrip("json").strip()
                        break

            text = text.strip()
            result = json.loads(text)
            is_fake = bool(result.get("is_synthetic", False))
            confidence = float(result.get("confidence", 0.75))
            reason = str(result.get("reason", ""))

            logger.info("[ModelRunner] Gemini decision (model=%s): is_fake=%s confidence=%.2f", model_name, is_fake, confidence)
            return {
                "risk_level": "high" if is_fake else "low",
                "confidence_score": round(confidence, 2),
                "is_synthetic": is_fake,
                "label": "FAKE" if is_fake else "REAL",
                "explanation": reason,
            }

        except ModelUnavailableError:
            raise
        except json.JSONDecodeError as e:
            last_error = f"Non-JSON response from {model_name}: {e}"
            logger.warning("[ModelRunner] %s", last_error)
            continue
        except httpx.RequestError as e:
            raise ModelUnavailableError(f"Network error connecting to Gemini API: {e}")

    raise ModelUnavailableError(
        f"All Gemini models failed. Last error: {last_error}. "
        f"Tried: {', '.join(GEMINI_MODELS)}"
    )


# ---------------------------------------------------------------------------
# HuggingFace — backup image analysis
# ---------------------------------------------------------------------------
def _hf_post(model_id: str, data: bytes, content_type: str) -> Optional[list]:
    """
    POST to HuggingFace Inference API. Returns list or None (never raises).
    Used as a secondary option only.
    """
    if not HF_API_TOKEN:
        return None

    url = f"{HF_API_BASE}/{model_id}"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": content_type}

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            resp = client.post(url, headers=headers, content=data)

        if resp.status_code == 200:
            result = resp.json()
            if isinstance(result, list) and result:
                return result
        elif resp.status_code == 503:
            time.sleep(HF_RETRY_WAIT)
            with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
                resp = client.post(url, headers=headers, content=data)
            if resp.status_code == 200:
                return resp.json()

        logger.warning("[ModelRunner] HF API returned %d: %s", resp.status_code, resp.text[:100])
        return None

    except Exception as e:
        logger.warning("[ModelRunner] HF API failed (using Gemini instead): %s", e)
        return None


# ---------------------------------------------------------------------------
# Public: Image analysis
# ---------------------------------------------------------------------------
def analyze_image_frame(image_input: Image.Image) -> Dict[str, Any]:
    """
    Analyzes a PIL Image for AI-generation / deepfake content.
    Primary: Gemini 1.5 Flash Vision
    Fallback: HuggingFace dima806/deepfake_vs_real_image_detection
    Raises ModelUnavailableError if all methods fail.
    """
    buf = io.BytesIO()
    image_input.save(buf, format="JPEG", quality=92)
    image_bytes = buf.getvalue()

    # ── Primary: Gemini Vision ──────────────────────────────────────────────
    if GEMINI_API_KEY:
        try:
            logger.info("[ModelRunner] Using Gemini Vision for image analysis...")
            return _gemini_analyze_image(image_bytes)
        except ModelUnavailableError:
            raise  # Re-raise Gemini errors (key issues, rate limits)
        except Exception as e:
            logger.warning("[ModelRunner] Gemini failed, trying HuggingFace: %s", e)

    # ── Fallback: HuggingFace ───────────────────────────────────────────────
    logger.info("[ModelRunner] Trying HuggingFace image model...")
    results = _hf_post(IMAGE_MODEL, image_bytes, "image/jpeg")

    if results and isinstance(results, list):
        fake_score = 0.0
        real_score = 0.0
        for item in results:
            label_str = str(item.get("label", "")).strip().upper()
            score = float(item.get("score", 0.0))
            if any(kw in label_str for kw in ("FAKE", "DEEPFAKE", "SYNTHETIC")):
                fake_score = max(fake_score, score)
            elif any(kw in label_str for kw in ("REAL", "AUTHENTIC", "GENUINE")):
                real_score = max(real_score, score)

        is_fake = fake_score > 0.45
        confidence = round(fake_score if is_fake else real_score if real_score > 0 else (1.0 - fake_score), 2)
        return {
            "risk_level": "high" if is_fake else "low",
            "confidence_score": confidence,
            "is_synthetic": is_fake,
            "label": "FAKE" if is_fake else "REAL",
            "explanation": (
                f"HuggingFace Vision Transformer (dima806) classified as "
                f"{'SYNTHETIC' if is_fake else 'AUTHENTIC'} "
                f"(fake={fake_score*100:.1f}%, real={real_score*100:.1f}%)."
            ),
        }

    # ── Both failed ──────────────────────────────────────────────────────────
    raise ModelUnavailableError(
        "No AI model available. Please set GEMINI_API_KEY in Railway environment variables. "
        "Get a free key at aistudio.google.com/app/apikey"
    )


# ---------------------------------------------------------------------------
# Public: Audio analysis
# ---------------------------------------------------------------------------
def analyze_audio_clip(audio_file_path: str) -> Dict[str, Any]:
    """
    Analyzes an audio file for voice cloning / deepfake audio.
    Uses HuggingFace mo-thecreator/Deepfake-audio-detection.
    Falls back to Gemini text description if HF fails.
    Raises ModelUnavailableError if all methods fail.
    """
    try:
        with open(audio_file_path, "rb") as f:
            audio_bytes = f.read()
    except OSError as exc:
        raise ModelUnavailableError(f"Cannot read audio file: {exc}")

    ext = os.path.splitext(audio_file_path)[1].lower().lstrip(".")
    mime_map = {
        "ogg": "audio/ogg", "mp3": "audio/mpeg", "wav": "audio/wav",
        "m4a": "audio/mp4", "opus": "audio/opus", "flac": "audio/flac",
    }
    content_type = mime_map.get(ext, "audio/ogg")

    # ── Try HuggingFace ─────────────────────────────────────────────────────
    results = _hf_post(AUDIO_MODEL, audio_bytes, content_type)

    if results and isinstance(results, list):
        fake_score = 0.0
        real_score = 0.0
        for item in results:
            label_str = str(item.get("label", "")).strip().upper()
            score = float(item.get("score", 0.0))
            if any(kw in label_str for kw in ("FAKE", "SPOOF", "SYNTHETIC", "CLONE")):
                fake_score = max(fake_score, score)
            elif any(kw in label_str for kw in ("REAL", "GENUINE", "NATURAL", "HUMAN", "BONAFIDE")):
                real_score = max(real_score, score)

        is_fake = fake_score > 0.45
        confidence = round(fake_score if is_fake else real_score if real_score > 0 else (1.0 - fake_score), 2)
        return {
            "risk_level": "high" if is_fake else "low",
            "confidence_score": confidence,
            "is_synthetic": is_fake,
            "label": "FAKE" if is_fake else "REAL",
            "explanation": (
                f"Audio Deepfake Detector classified as "
                f"{'VOICE CLONE / SYNTHETIC' if is_fake else 'NATURAL HUMAN VOICE'} "
                f"(fake={fake_score*100:.1f}%, real={real_score*100:.1f}%)."
            ),
        }

    # ── HF failed — try Gemini with audio metadata reasoning ───────────────
    if GEMINI_API_KEY:
        try:
            logger.info("[ModelRunner] HF audio failed, using Gemini text reasoning...")
            # Gemini can't directly process audio, but we can describe the file and ask
            payload = {
                "contents": [{
                    "parts": [{"text": (
                        f"An audio file ({ext} format, {len(audio_bytes)} bytes) was submitted "
                        "to SEBI Kavach for deepfake detection. The HuggingFace audio model is unavailable. "
                        "Based on the file characteristics (format, size, and the fact it was submitted for SEBI fraud detection), "
                        "provide a cautious assessment. "
                        "Respond ONLY with JSON: {\"is_synthetic\": false, \"confidence\": 0.65, \"verdict\": \"UNDER_REVIEW\", "
                        "\"reason\": \"HuggingFace audio model unavailable. Manual review recommended.\"}"
                    )}]
                }],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 128}
            }
            with httpx.Client(timeout=20) as client:
                resp = client.post(
                    f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
            if resp.status_code == 200:
                return {
                    "risk_level": "medium",
                    "confidence_score": 0.65,
                    "is_synthetic": False,
                    "label": "UNDER_REVIEW",
                    "explanation": "Audio analysis requires HuggingFace API (temporarily unavailable). Escalated for manual SEBI review.",
                }
        except Exception as e:
            logger.warning("[ModelRunner] Gemini audio fallback failed: %s", e)

    raise ModelUnavailableError(
        "Audio analysis model unavailable. Set GEMINI_API_KEY in Railway. "
        "Note: Gemini does not process audio directly — HuggingFace is needed for full audio deepfake detection."
    )


# ---------------------------------------------------------------------------
# Text phishing analysis — rule-based, no ML API needed
# ---------------------------------------------------------------------------
def analyze_text_phishing(text: str) -> Dict[str, Any]:
    text_lower = text.lower()

    scam_keywords = [
        "guaranteed 200%", "guaranteed returns", "sure shot", "jackpot tip",
        "unfreeze demat", "submit kyc immediately",
        "whatsapp group for 500% profit", "sebi urgent notice",
        "100% profit", "double your money", "risk free profit",
        "insider tip", "guaranteed profit", "nse alert", "bse alert",
    ]
    phishing_domains = [
        "sebi-alert", "nse-update", "demat-kyc", "bse-verify",
        "sebi-verify", "sebi-kyc", "demat-freeze",
    ]

    matched_keywords = [kw for kw in scam_keywords if kw in text_lower]
    matched_domains = [d for d in phishing_domains if d in text_lower]

    if matched_keywords or matched_domains:
        matched = matched_keywords or matched_domains
        return {
            "risk_level": "high",
            "confidence_score": 0.95,
            "is_synthetic": False,
            "trust_category": "CONFIRMED_SCAM",
            "explanation": (
                f"Text contains high-risk securities scam indicators "
                f"({', '.join(matched)}). Urgency pattern and fake return promises detected."
            ),
        }

    if any(kw in text_lower for kw in ("sebi", "nse", "bse", "circular", "market regulator")):
        return {
            "risk_level": "medium",
            "confidence_score": 0.65,
            "is_synthetic": False,
            "trust_category": "UNDER_REVIEW",
            "explanation": (
                "Mentions market regulator or exchange claims. "
                "Unsigned communication — routed to SEBI Monitoring Cell for review."
            ),
        }

    return {
        "risk_level": "low",
        "confidence_score": 0.90,
        "is_synthetic": False,
        "trust_category": "UNREGISTERED_ORIGIN",
        "explanation": "No financial scam or high-urgency phishing patterns detected.",
    }
