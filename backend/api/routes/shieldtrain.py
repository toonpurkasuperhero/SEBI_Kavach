from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter(prefix="/shieldtrain", tags=["ShieldTrain"])

class CampaignStats(BaseModel):
    user_id: str
    simulations_received: int
    click_through_rate: float
    risk_profile: str

@router.get("/stats/{user_id}", response_model=CampaignStats)
def get_user_stats(user_id: str):
    # Mock behavior for MVP
    return CampaignStats(
        user_id=user_id,
        simulations_received=random.randint(5, 20),
        click_through_rate=random.uniform(0.05, 0.30),
        risk_profile="moderate" if random.random() > 0.5 else "low"
    )
