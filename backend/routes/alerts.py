from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Alert, User
from auth import require_role

router = APIRouter(prefix="/alerts")

@router.get("")
def list_alerts(
    attack_type: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None),
    incident_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "analyst"))
):
    query = db.query(Alert).order_by(Alert.timestamp.desc())
    if attack_type:
        query = query.filter(Alert.attack_type == attack_type)
    if min_confidence:
        query = query.filter(Alert.confidence_score >= min_confidence)
    if incident_id:
        query = query.filter(Alert.incident_id == incident_id)
    alerts = query.limit(limit).all()
    return alerts

@router.get("/incidents")
def list_incidents(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "analyst"))
):
    alerts = db.query(Alert).filter(Alert.incident_id.isnot(None)).order_by(Alert.timestamp.desc()).all()
    grouped = {}
    for alert in alerts:
        iid = alert.incident_id
        if iid not in grouped:
            grouped[iid] = []
        grouped[iid].append(alert)
    return grouped

@router.get("/{alert_id}")
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "analyst"))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="alert not found")
    return alert

@router.post("/{alert_id}/feedback")
def submit_feedback(
    alert_id: int,
    feedback: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "analyst"))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="alert not found")
    if feedback.get("verdict") not in ("tp", "fp", "suspicious"):
        raise HTTPException(status_code=400, detail="verdict must be tp, fp, or suspicious")
    alert.analyst_feedback = {
        "verdict": feedback["verdict"],
        "comment": feedback.get("comment", ""),
        "analyst": current_user.username
    }
    db.commit()
    db.refresh(alert)
    return {"status": "ok", "feedback": alert.analyst_feedback}
