from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source_ip = Column(String, nullable=True)
    destination_ip = Column(String, nullable=True)
    attack_type = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    top_shap_features = Column(JSON, nullable=True)
    llm_explanation = Column(String, nullable=True)
    tier_reached = Column(Integer, nullable=False)
    analyst_feedback = Column(JSON, nullable=True)
    incident_id = Column(String, nullable=True)
    abuse_ipdb_score = Column(Integer, nullable=True)

class Flow(Base):
    __tablename__ = "flows"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source_ip = Column(String, nullable=True)
    destination_ip = Column(String, nullable=True)
    flagged = Column(Boolean, default=False)
    tier1_score = Column(Float, nullable=True)
    summary = Column(JSON, nullable=True)

class IPReputation(Base):
    __tablename__ = "ip_reputation"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, nullable=False, index=True)
    abuse_score = Column(Integer, nullable=True)
    checked_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
