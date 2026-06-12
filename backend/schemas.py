from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FlowInput(BaseModel):
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    features: dict

class AlertOut(BaseModel):
    id: int
    timestamp: datetime
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    attack_type: str
    confidence_score: float
    anomaly_score: float
    top_shap_features: Optional[dict] = None
    llm_explanation: Optional[str] = None
    tier_reached: int

    class Config:
        from_attributes = True
