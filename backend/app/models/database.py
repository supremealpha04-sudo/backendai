"""
FELDOR_HEALTH - Database Models
SQLAlchemy models for PostgreSQL (Supabase)
"""
from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean, JSON, Integer, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class CaseStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"

class CancerModule(str, enum.Enum):
    BREAST = "breast"
    CERVICAL = "cervical"

class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    case_id = Column(String, unique=True, index=True)
    module = Column(String)  # breast or cervical
    status = Column(String, default=CaseStatus.PENDING)

    # Upload info
    original_filename = Column(String)
    storage_path = Column(String)
    file_type = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)

    # AI Results
    prediction = Column(String)
    confidence = Column(Float)
    risk_score = Column(Float)
    risk_level = Column(String)
    findings = Column(JSON)
    review_required = Column(Boolean, default=True)

    # Model info
    model_version = Column(String)
    processing_time_ms = Column(Integer)

    # Review
    reviewer_id = Column(String, nullable=True)
    review_date = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewer_status = Column(String, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    audit_log = Column(JSON, default=list)

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String, primary_key=True)
    module = Column(String)
    version = Column(String)
    name = Column(String)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    metrics = Column(JSON)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    case_id = Column(String, index=True)
    action = Column(String)
    user_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON)
    ip_address = Column(String)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
