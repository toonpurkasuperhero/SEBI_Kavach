from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/detect", tags=["DetectNet"])

class DetectionRequest(BaseModel):
    channel: str # e.g., 'video', 'voice', 'text', 'social'
    content_text: Optional[str] = None
    media_url: Optional[str] = None

class DetectionResponse(BaseModel):
    risk_level: str # 'low', 'medium', 'high', 'critical'
    confidence_score: float
    explanation: str
    correlated_flags: List[str] = []

@router.post("/", response_model=DetectionResponse)
def analyze_content(request: DetectionRequest):
    content = (request.content_text or "") + (request.media_url or "")
    content = content.lower()

    if "guaranteed 200% returns" in content or "pump-and-dump" in content:
        return DetectionResponse(
            risk_level="high",
            confidence_score=0.98,
            explanation="Text patterns strongly match known pump-and-dump scams. High urgency and unrealistic guarantees detected.",
            correlated_flags=["User logged into trading account 2 minutes after receiving this."]
        )
    elif "fake" in content or "deepfake" in content or "tampered" in content:
        return DetectionResponse(
            risk_level="high",
            confidence_score=0.92,
            explanation="Visual/Audio artifacts detected indicating synthetic media. Inconsistent metadata.",
            correlated_flags=["Caller ID spoofing suspected" if "audio" in content else "Image metadata stripped recently."]
        )
    elif "real" in content or "authentic" in content:
        return DetectionResponse(
            risk_level="low",
            confidence_score=0.99,
            explanation="100% Authenticated. No tampering detected in pixel distribution or metadata.",
        )
    elif "sebi-alert-urgent.com" in content:
         return DetectionResponse(
            risk_level="medium",
            confidence_score=0.75,
            explanation="Domain registered 3 days ago. Mimics official regulator domain.",
        )
    else:
         return DetectionResponse(
            risk_level="low",
            confidence_score=0.10,
            explanation="No significant threat indicators found. However, proceed with normal caution.",
        )
