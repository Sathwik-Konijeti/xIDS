from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Alert, Flow, User
from auth import require_role

router = APIRouter(prefix="/stats")

@router.get("")
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "analyst", "viewer"))
):
    total_alerts = db.query(Alert).count()
    total_flows = db.query(Flow).count()
    flagged_flows = db.query(Flow).filter(Flow.flagged == True).count()

    # alerts by attack type
    by_type = db.query(
        Alert.attack_type,
        func.count(Alert.id).label("count")
    ).group_by(Alert.attack_type).all()

    # alerts by tier
    by_tier = db.query(
        Alert.tier_reached,
        func.count(Alert.id).label("count")
    ).group_by(Alert.tier_reached).all()

    return {
        "total_alerts": total_alerts,
        "total_flows": total_flows,
        "flagged_flows": flagged_flows,
        "by_attack_type": {row.attack_type: row.count for row in by_type},
        "by_tier": {row.tier_reached: row.count for row in by_tier},
    }
