from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Alert, Flow
from schemas import FlowInput, AlertOut
from services.detection import run_detection

router = APIRouter()

@router.post("/ingest", response_model=AlertOut)
def ingest_flow(flow: FlowInput, db: Session = Depends(get_db)):
    # run tiered detection
    result = run_detection(flow.features)

    # save flow record
    db_flow = Flow(
        source_ip=flow.source_ip,
        destination_ip=flow.destination_ip,
        flagged=result["flagged"],
        tier1_score=result["anomaly_score"],
        summary={"attack_type": result["attack_type"]}
    )
    db.add(db_flow)

    # only save alert if flagged
    db_alert = None
    if result["flagged"]:
        db_alert = Alert(
            source_ip=flow.source_ip,
            destination_ip=flow.destination_ip,
            attack_type=result["attack_type"],
            confidence_score=result["confidence_score"],
            anomaly_score=result["anomaly_score"],
            top_shap_features=result["top_shap_features"],
            tier_reached=result["tier_reached"],
        )
        db.add(db_alert)

    db.commit()

    if db_alert:
        db.refresh(db_alert)
        return db_alert

    # return a minimal response for benign flows
    return AlertOut(
        id=0,
        timestamp=db_flow.timestamp,
        source_ip=flow.source_ip,
        destination_ip=flow.destination_ip,
        attack_type="benign",
        confidence_score=0.0,
        anomaly_score=result["anomaly_score"],
        tier_reached=1,
    )
