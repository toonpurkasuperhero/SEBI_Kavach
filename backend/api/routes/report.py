from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/report", tags=["Report"])

class ReportRequest(BaseModel):
    content_id: str
    reason: str

class ReportResponse(BaseModel):
    status: str
    message: str

@router.post("/", response_model=ReportResponse)
def submit_report(request: ReportRequest):
    # Mock behavior: just log it and return success
    print(f"Received manual ML review report for {request.content_id}: {request.reason}")
    return ReportResponse(
        status="success",
        message="Report submitted successfully. Added to manual ML review queue."
    )
