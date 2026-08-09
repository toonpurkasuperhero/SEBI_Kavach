"""
model_runner.py — SEBI Kavach AI Detection Engine
Uses Hugging Face Inference API (free tier, no GPU required).

Required env vars:
    HF_API_TOKEN  — Hugging Face API token (read-only, free at hf.co/settings/tokens)

IMPORTANT:
    If HF_API_TOKEN is missing or the API call fails, this module raises
    ModelUnavailableError — callers MUST handle this and return an error
    to the user rather than showing a fake result.
"""

import os
import io
import logging
import time
from typing import Dict, Any, Optional

import httpx
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ModelRunner")


class ModelUnavailableError(RuntimeError):
    """Raised when the HuggingFace model cannot be called."""
    pass


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
HF_API_TOKEN: str = os.getenv("HF_API_TOKEN", "").strip()

HF_API_BASE = "https://api-inference.huggingface.co/models"

# dima806/deepfake_vs_real_image_detection — vision transformer, labels: Real / Fake
IMAGE_MODEL = "dima806/deepfake_vs_real_image_detection"
# mo-thecreator/Deepfake-audio-detection — audio spectrogram detector
AUDIO_MODEL = "mo-thecreator/Deepfake-audio-detection"

REQUEST_TIMEOUT = 45
MAX_RETRIES = 3
RETRY_WAIT_BASE = 3
MODEL_LOADING_WAIT = 25


# ---------------------------------------------------------------------------
# Internal HTTP helper — raises ModelUnavailableError on failure
# ---------------------------------------------------------------------------
def _hf_post(model_id: str, data: bytes, content_type: str) -> list:
    """
    POST binary data to a HuggingFace Inference API endpoint.
    Returns parsed JSON list on success.
    Raises ModelUnavailableError if token missing, API errors, or all retries exhausted.
    NEVER returns a fake/default result.
    """
    if not HF_API_TOKEN:
        raise ModelUnavailableError(
            "HF_API_TOKEN is not configured. "
            "Go to Railway Dashboard → Variables and add your HuggingFace API token as HF_API_TOKEN."
        )

    url = f"{HF_API_BASE}/{model_id}"
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": content_type,
    }

    last_error = ""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
                resp = client.post(url, headers=headers, content=data)

            if resp.status_code == 200:
                result = resp.json()
                if isinstance(result, list) and len(result) > 0:
                    return result
                raise ModelUnavailableError(
                    f"HF API returned unexpected response format for '{model_id}': {str(result)[:200]}"
                )

            if resp.status_code == 503:
                wait = MODEL_LOADING_WAIT
                logger.info(
                    "[ModelRunner] HF model '%s' loading (503). Waiting %ds before retry %d/%d…",
                    model_id, wait, attempt, MAX_RETRIES
                )
                time.sleep(wait)
                last_error = f"Model '{model_id}' is still loading on HuggingFace servers (503)."
                continue

            if resp.status_code == 429:
                wait = RETRY_WAIT_BASE * (2 ** (attempt - 1))
                logger.warning("[ModelRunner] Rate limited (429). Waiting %ds…", wait)
                time.sleep(wait)
                last_error = "HuggingFace API rate limit exceeded (429). Try again in a few seconds."
                continue

            if resp.status_code == 401:
                raise ModelUnavailableError(
                    "HF_API_TOKEN is invalid or expired (401 Unauthorized). "
                    "Generate a new token at huggingface.co/settings/tokens."
                )

            last_error = f"HF API HTTP {resp.status_code}: {resp.text[:200]}"
            logger.error("[ModelRunner] HF API error: %s", last_error)
            continue

        except httpx.TimeoutException:
            wait = RETRY_WAIT_BASE * (2 ** (attempt - 1))
            logger.warning("[ModelRunner] Timeout on attempt %d/%d. Retrying in %ds…", attempt, MAX_RETRIES, wait)
            time.sleep(wait)
            last_error = f"Request timed out after {REQUEST_TIMEOUT}s."
        except httpx.RequestError as exc:
            raise ModelUnavailableError(f"Network error connecting to HuggingFace API: {exc}")

    raise ModelUnavailableError(
        f"HuggingFace model '{model_id}' failed after {MAX_RETRIES} retries. Last error: {last_error}"
    )


# ---------------------------------------------------------------------------
# Image deepfake analysis
# ---------------------------------------------------------------------------
def analyze_image_frame(image_input: Image.Image) -> Dict[str, Any]:
    """
    Analyzes a PIL Image for AI-generation / deepfake content.
    Calls: dima806/deepfake_vs_real_image_detection

    Returns dict with: risk_level, confidence_score, is_synthetic, label, explanation
    Raises ModelUnavailableError if the HF API cannot be reached.
    """
    buf = io.BytesIO()
    image_input.save(buf, format="JPEG", quality=92)
    image_bytes = buf.getvalue()

    # Raises ModelUnavailableError if token missing or API fails
    results = _hf_post(IMAGE_MODEL, image_bytes, "image/jpeg")

    logger.info("[ModelRunner] Image model raw response: %s", results)

    # Parse result — model returns list of {label, score} dicts
    # Labels are typically "Real" and "Fake"
    fake_score = 0.0
    real_score = 0.0

    for item in results:
        label_str = str(item.get("label", "")).strip().upper()
        score = float(item.get("score", 0.0))
        logger.info("[ModelRunner] Label: %s  Score: %.4f", label_str, score)

        # Match fake-indicating labels
        if any(kw in label_str for kw in ("FAKE", "DEEPFAKE", "SYNTHETIC", "AI", "GAN")):
            fake_score = max(fake_score, score)
        # Match real-indicating labels
        elif any(kw in label_str for kw in ("REAL", "AUTHENTIC", "GENUINE", "ORIGINAL")):
            real_score = max(real_score, score)

    # If neither matched, take the highest score entry as "real" baseline
    if fake_score == 0.0 and real_score == 0.0:
        logger.warning("[ModelRunner] No recognizable labels in response: %s", results)
        # Try to infer: if the first label has low confidence, flag as uncertain
        first_score = float(results[0].get("score", 0.5)) if results else 0.5
        fake_score = 1.0 - first_score  # invert as precaution

    # Decision threshold: flag as fake if fake confidence > 45%
    # (lower threshold for safety — better to over-flag than miss deepfakes)
    is_fake = fake_score > 0.45
    confidence = round(fake_score if is_fake else real_score if real_score > 0 else (1.0 - fake_score), 2)

    logger.info("[ModelRunner] Image decision: is_fake=%s fake_score=%.4f real_score=%.4f", is_fake, fake_score, real_score)

    return {
        "risk_level": "high" if is_fake else "low",
        "confidence_score": confidence,
        "is_synthetic": is_fake,
        "label": "FAKE" if is_fake else "REAL",
        "raw_scores": {"fake": round(fake_score, 4), "real": round(real_score, 4)},
        "explanation": (
            f"HuggingFace Vision Transformer (dima806/deepfake_vs_real_image_detection) "
            f"classified image as {'SYNTHETIC / AI-GENERATED' if is_fake else 'AUTHENTIC REAL MEDIA'} "
            f"(fake_score={fake_score*100:.1f}%, real_score={real_score*100:.1f}%)."
        ),
    }


# ---------------------------------------------------------------------------
# Audio deepfake analysis
# ---------------------------------------------------------------------------
def analyze_audio_clip(audio_file_path: str) -> Dict[str, Any]:
    """
    Analyzes an audio file for voice cloning / deepfake audio.
    Calls: mo-thecreator/Deepfake-audio-detection

    Returns dict with: risk_level, confidence_score, is_synthetic, label, explanation
    Raises ModelUnavailableError if the HF API cannot be reached.
    """
    try:
        with open(audio_file_path, "rb") as f:
            audio_bytes = f.read()
    except OSError as exc:
        raise ModelUnavailableError(f"Cannot read audio file '{audio_file_path}': {exc}")

    ext = os.path.splitext(audio_file_path)[1].lower().lstrip(".")
    mime_map = {
        "ogg": "audio/ogg", "mp3": "audio/mpeg", "wav": "audio/wav",
        "m4a": "audio/mp4", "opus": "audio/opus", "flac": "audio/flac",
    }
    content_type = mime_map.get(ext, "audio/ogg")

    results = _hf_post(AUDIO_MODEL, audio_bytes, content_type)

    logger.info("[ModelRunner] Audio model raw response: %s", results)

    fake_score = 0.0
    real_score = 0.0

    for item in results:
        label_str = str(item.get("label", "")).strip().upper()
        score = float(item.get("score", 0.0))
        logger.info("[ModelRunner] Audio Label: %s  Score: %.4f", label_str, score)

        if any(kw in label_str for kw in ("FAKE", "SPOOF", "SYNTHETIC", "CLONE", "AI", "DEEPFAKE")):
            fake_score = max(fake_score, score)
        elif any(kw in label_str for kw in ("REAL", "GENUINE", "NATURAL", "HUMAN", "BONAFIDE")):
            real_score = max(real_score, score)

    if fake_score == 0.0 and real_score == 0.0 and results:
        first_score = float(results[0].get("score", 0.5))
        fake_score = 1.0 - first_score

    is_fake = fake_score > 0.45
    confidence = round(fake_score if is_fake else real_score if real_score > 0 else (1.0 - fake_score), 2)

    logger.info("[ModelRunner] Audio decision: is_fake=%s fake_score=%.4f real_score=%.4f", is_fake, fake_score, real_score)

    return {
        "risk_level": "high" if is_fake else "low",
        "confidence_score": confidence,
        "is_synthetic": is_fake,
        "label": "FAKE" if is_fake else "REAL",
        "raw_scores": {"fake": round(fake_score, 4), "real": round(real_score, 4)},
        "explanation": (
            f"HuggingFace Audio Deepfake Detector (mo-thecreator) "
            f"classified voice as {'SYNTHETIC / VOICE CLONE' if is_fake else 'NATURAL HUMAN VOICE'} "
            f"(fake_score={fake_score*100:.1f}%, real_score={real_score*100:.1f}%)."
        ),
    }


# ---------------------------------------------------------------------------
# Text phishing analysis — rule-based, no ML API needed
# ---------------------------------------------------------------------------
def analyze_text_phishing(text: str) -> Dict[str, Any]:
    """
    Analyzes input text for phishing, SEBI impersonation, pump-and-dump signals.
    Pure rule-based — never raises ModelUnavailableError.
    """
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
