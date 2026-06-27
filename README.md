# FELDOR_HEALTH - AI Cancer Detection Platform

A production-ready healthcare AI platform for breast and cervical cancer detection.

## Features

- **Breast Cancer Detection**: Mammography analysis with DICOM support
- **Cervical Cancer Detection**: Pap smear cytology with cell-level analysis
- **AI Heatmap Overlays**: Visual localization of suspicious regions
- **Clinician Review Workflow**: Pending → Reviewed → Approved/Rejected
- **Audit Logging**: Complete traceability of all actions
- **Model Management**: Support for multiple model versions
- **Performance Dashboard**: Real-time analytics

## Architecture

```
feldor_health/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuration
│   │   ├── models/         # Database models
│   │   ├── routers/        # API endpoints
│   │   └── services/       # AI pipelines
│   ├── ai_models/          # PyTorch model weights
│   ├── main.py             # FastAPI entry point
│   └── requirements.txt
├── frontend/               # Vanilla JS SPA
├── database/               # PostgreSQL schema
└── uploads/                # File storage
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Initialize Database

```bash
# Run schema.sql in your PostgreSQL/Supabase SQL editor
psql -d feldor_health -f database/schema.sql
```

### 4. Start Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access Frontend

Open `http://localhost:8000` in your browser.

## AI Model Integration

To use real trained models:

1. Train your PyTorch models
2. Save weights to `backend/ai_models/breast/breast_v1.pt`
3. The pipeline will automatically load them on startup

### Model Interface

Your model should output:
- **Classification logits**: Shape `(batch, 3)` for [Normal, Suspicious, High]
- **Localization heatmap**: Shape `(batch, 1, H, W)` for attention visualization

## API Endpoints

### Breast Module
- `POST /api/breast/upload` - Upload and analyze mammogram
- `GET /api/breast/cases` - List breast cases
- `GET /api/breast/cases/{id}` - Get case details
- `POST /api/breast/cases/{id}/review` - Submit review
- `GET /api/breast/dashboard` - Dashboard stats

### Cervical Module
- `POST /api/cervical/upload` - Upload and analyze Pap smear
- `GET /api/cervical/cases` - List cervical cases
- `GET /api/cervical/cases/{id}` - Get case details
- `POST /api/cervical/cases/{id}/review` - Submit review
- `GET /api/cervical/dashboard` - Dashboard stats

## Security

- File type validation
- Size limits (50MB max)
- Audit logging
- CORS configuration
- Input sanitization

## License

Clinical Decision Support System - For research and clinical assistance only.
