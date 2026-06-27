-- FELDOR_HEALTH Database Schema
-- PostgreSQL schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(255) NOT NULL,
    case_id VARCHAR(255) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL CHECK (module IN ('breast', 'cervical')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),

    original_filename VARCHAR(500),
    storage_path TEXT,
    file_type VARCHAR(50),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    prediction VARCHAR(255),
    confidence FLOAT,
    risk_score FLOAT,
    risk_level VARCHAR(50) CHECK (risk_level IN ('low', 'medium', 'high')),
    findings JSONB DEFAULT '[]',
    review_required BOOLEAN DEFAULT TRUE,

    model_version VARCHAR(100),
    processing_time_ms INTEGER,

    reviewer_id VARCHAR(255),
    review_date TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    reviewer_status VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    audit_log JSONB DEFAULT '[]'
);

-- Model versions table
CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    version VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metrics JSONB DEFAULT '{}'
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) DEFAULT 'system',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cases_module ON cases(module);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_patient ON cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_upload_date ON cases(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Insert default model versions
INSERT INTO model_versions (module, version, name, description, is_active) VALUES
('breast', 'breast_v1', 'Breast AI v1', 'Initial breast cancer detection model', TRUE),
('breast', 'breast_v2', 'Breast AI v2', 'Enhanced breast cancer detection with improved localization', FALSE),
('cervical', 'cervical_v1', 'Cervical AI v1', 'Initial cervical cancer cytology model', TRUE)
ON CONFLICT DO NOTHING;
