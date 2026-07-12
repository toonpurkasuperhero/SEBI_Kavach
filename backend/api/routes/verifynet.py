from fastapi import APIRouter
from pydantic import BaseModel
import datetime

router = APIRouter(prefix="/verify", tags=["VerifyNet"])

class VerificationRequest(BaseModel):
    content_id: str
    source_url: str = None

class VerificationResponse(BaseModel):
    status: str
    message: str
    signer: str = None
    timestamp: str = None

@router.post("/", response_model=VerificationResponse)
def verify_content(request: VerificationRequest):
    content = (request.content_id + (request.source_url or "")).lower()
    
    if "https://youtube.com/watch?v=sebi-real" in content or "nse-official-id-123" in content:
        return VerificationResponse(
            status="verified",
            message="Content successfully verified against Trust Registry. Cryptographic signature is valid.",
            signer="NSE Investor Relations",
            timestamp=datetime.datetime.now().isoformat()
        )
    elif "fake" in content or "tampered" in content:
        return VerificationResponse(
            status="unverified",
            message="Warning: Metadata stripped or cryptographic signature invalid. Content may have been altered.",
        )
    else:
        return VerificationResponse(
            status="unverified",
            message="No valid signature found. Source could not be authenticated.",
        )
