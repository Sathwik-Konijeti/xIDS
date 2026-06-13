import requests
import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

ABUSEIPDB_KEY = os.getenv("ABUSEIPDB_API_KEY")
CACHE_TTL_HOURS = 24

def check_ip(ip: str, db: Session) -> dict:
    try:
        # lazy import to avoid circular
        from models import IPReputation

        # check cache first
        cached = db.query(IPReputation).filter(IPReputation.ip_address == ip).first()
        if cached and cached.expires_at > datetime.now(timezone.utc):
            return {
                "abuse_score": cached.abuse_score,
                "cached": True
            }

        # call abuseipdb
        response = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            headers={"Key": ABUSEIPDB_KEY, "Accept": "application/json"},
            params={"ipAddress": ip, "maxAgeInDays": 90},
            timeout=5
        )
        data = response.json().get("data", {})
        score = data.get("abuseConfidenceScore", 0)

        # upsert cache
        if cached:
            cached.abuse_score = score
            cached.checked_at = datetime.now(timezone.utc)
            cached.expires_at = datetime.now(timezone.utc) + timedelta(hours=CACHE_TTL_HOURS)
        else:
            cached = IPReputation(
                ip_address=ip,
                abuse_score=score,
                checked_at=datetime.now(timezone.utc),
                expires_at=datetime.now(timezone.utc) + timedelta(hours=CACHE_TTL_HOURS)
            )
            db.add(cached)
        db.commit()

        return {"abuse_score": score, "cached": False}

    except Exception as e:
        return {"abuse_score": None, "cached": False, "error": str(e)}
