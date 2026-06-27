"""
FELDOR_HEALTH - Cervical Cancer API Routes
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
import os
import shutil
from datetime import datetime
from typing import Optional
import json
import numpy as np
import cv2
import base64

from app.models.database import get_db, Case, CaseStatus, CancerModule, AuditLog
from app.core.config import settings
from app.services.cervical_pipeline import CervicalAIPipeline

router = APIRouter(prefix="/api/cervical", tags=["cervical"])

# Initialize pipeline
pipeline = CervicalAIPipeline(settings.CERVICAL_MODEL_V1_PATH)

def save_upload(file: UploadFile, case_id: str) -> str:
    """Save uploaded file and return path"""
    upload_dir = os.path.join(settings.UPLOAD_DIR, "cervical", case_id)
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path

def log_audit(db: Session, case_id: str, action: str, user_id: str = "system", details: dict = None):
    """Log audit event"""
    audit = AuditLog(
        id=str(uuid.uuid4()),
        case_id=case_id,
        action=action,
        user_id=user_id,
        details=details or {}
    )
    db.add(audit)
    db.commit()

def encode_image(image: np.ndarray) -> str:
    """Encode numpy array to base64 string"""
    _, buffer = cv2.imencode('.png', cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    return base64.b64encode(buffer).decode('utf-8')

@router.post("/upload")
async def upload_cervical_scan(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    patient_id: Optional[str] = "",
    model_version: Optional[str] = "cervical_v1",
    db: Session = Depends(get_db)
):
    """
    Upload Pap smear image and run AI inference
    """
    # Validate file
    ext = os.path.splitext(file.filename)[1].lower()
    allowed = {".png", ".jpg", ".jpeg", ".tiff", ".tif"}
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}. Use PNG, JPG, or TIFF.")

    case_id = str(uuid.uuid4())

    try:
        # Save file
        file_path = save_upload(file, case_id)

        # Log audit
        log_audit(db, case_id, "UPLOAD", details={"filename": file.filename, "patient_id": patient_id})

        # Run inference
        result = pipeline.predict(file_path, case_id)

        # Get preprocessing preview
        preview = pipeline.get_preprocessing_preview(file_path)

        # Save to database
        case = Case(
            id=case_id,
            patient_id=patient_id or case_id[:8],
            case_id=case_id,
            module=CancerModule.CERVICAL,
            status=CaseStatus.PENDING,
            original_filename=file.filename,
            storage_path=file_path,
            file_type=ext,
            prediction=result.prediction,
            confidence=result.confidence,
            risk_score=result.risk_score,
            risk_level="high" if result.risk_score > 0.7 else "medium" if result.risk_score > 0.4 else "low",
            findings=[{
                "cell_id": f.cell_id,
                "type": f.type,
                "bbox": f.bbox,
                "confidence": f.confidence,
                "abnormality_score": f.abnormality_score
            } for f in result.findings],
            review_required=result.review_required,
            model_version=model_version,
            processing_time_ms=result.processing_time_ms
        )
        db.add(case)
        db.commit()

        # Log inference
        log_audit(db, case_id, "INFERENCE", details={
            "model_version": model_version,
            "prediction": result.prediction,
            "confidence": result.confidence,
            "total_cells": result.total_cells,
            "suspicious_cells": result.suspicious_cells
        })

        # Prepare response
        response = {
            "case_id": case_id,
            "module": "cervical",
            "prediction": result.prediction,
            "confidence": result.confidence,
            "risk_score": result.risk_score,
            "risk_level": case.risk_level,
            "total_cells": result.total_cells,
            "suspicious_cells": result.suspicious_cells,
            "findings": case.findings,
            "review_required": result.review_required,
            "model_version": model_version,
            "processing_time_ms": result.processing_time_ms,
            "images": {
                "original": encode_image(preview["original"]),
                "preprocessed": encode_image(preview["preprocessed"]),
                "annotated": encode_image(result.annotated_image) if result.annotated_image is not None else None
            },
            "disclaimer": "AI results are intended to assist clinicians and require professional interpretation."
        }

        return JSONResponse(content=response)

    except Exception as e:
        log_audit(db, case_id, "ERROR", details={"error": str(e)})
        raise HTTPException(500, f"Processing error: {str(e)}")

@router.get("/cases")
async def list_cervical_cases(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List all cervical cancer cases"""
    query = db.query(Case).filter(Case.module == CancerModule.CERVICAL)

    if status:
        query = query.filter(Case.status == status)

    total = query.count()
    cases = query.order_by(Case.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "cases": [{
            "id": c.id,
            "case_id": c.case_id,
            "patient_id": c.patient_id,
            "status": c.status,
            "prediction": c.prediction,
            "confidence": c.confidence,
            "risk_level": c.risk_level,
            "upload_date": c.upload_date.isoformat() if c.upload_date else None,
            "review_required": c.review_required,
            "model_version": c.model_version,
            "processing_time_ms": c.processing_time_ms,
            "total_cells": len(c.findings) if c.findings else 0,
            "suspicious_cells": sum(1 for f in (c.findings or []) if f.get("abnormality_score", 0) > 0.5)
        } for c in cases]
    }

@router.get("/cases/{case_id}")
async def get_cervical_case(case_id: str, db: Session = Depends(get_db)):
    """Get specific case details"""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    return {
        "id": case.id,
        "case_id": case.case_id,
        "patient_id": case.patient_id,
        "status": case.status,
        "prediction": case.prediction,
        "confidence": case.confidence,
        "risk_score": case.risk_score,
        "risk_level": case.risk_level,
        "findings": case.findings,
        "review_required": case.review_required,
        "model_version": case.model_version,
        "upload_date": case.upload_date.isoformat() if case.upload_date else None,
        "reviewer_status": case.reviewer_status,
        "review_notes": case.review_notes
    }

@router.post("/cases/{case_id}/review")
async def review_case(
    case_id: str,
    status: str,
    notes: Optional[str] = "",
    reviewer_id: Optional[str] = "clinician",
    db: Session = Depends(get_db)
):
    """Submit clinician review"""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    case.status = status
    case.reviewer_id = reviewer_id
    case.review_date = datetime.utcnow()
    case.review_notes = notes
    case.reviewer_status = status
    case.updated_at = datetime.utcnow()

    db.commit()

    log_audit(db, case_id, "REVIEW", reviewer_id, {
        "status": status,
        "notes": notes
    })

    return {"message": "Review submitted successfully", "case_id": case_id}

@router.get("/dashboard")
async def cervical_dashboard(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total = db.query(Case).filter(Case.module == CancerModule.CERVICAL).count()
    pending = db.query(Case).filter(Case.module == CancerModule.CERVICAL, Case.status == CaseStatus.PENDING).count()
    reviewed = db.query(Case).filter(Case.module == CancerModule.CERVICAL, Case.status == CaseStatus.REVIEWED).count()
    urgent = db.query(Case).filter(
        Case.module == CancerModule.CERVICAL,
        Case.review_required == True,
        Case.status == CaseStatus.PENDING
    ).count()

    avg_confidence = db.query(Case).filter(Case.module == CancerModule.CERVICAL).with_entities(
        func.avg(Case.confidence)
    ).scalar() or 0

    avg_time = db.query(Case).filter(Case.module == CancerModule.CERVICAL).with_entities(
        func.avg(Case.processing_time_ms)
    ).scalar() or 0

    return {
        "total_cases": total,
        "pending_review": pending,
        "reviewed": reviewed,
        "urgent_review": urgent,
        "average_confidence": round(float(avg_confidence), 3),
        "average_processing_time_ms": round(float(avg_time), 1),
        "model_versions": ["cervical_v1"]
    }
