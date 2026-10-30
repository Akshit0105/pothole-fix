-- ==============================================================================
-- PotholeFix Municipal Platform - Supabase PostgreSQL Initial Migration
-- Migration: 001_initial_schema.sql
-- Description: Creates the 6 core tables mirroring backend/app/models.py
-- Target Engine: PostgreSQL 14+ (Supabase)
-- ==============================================================================

-- 1. Enable pgcrypto extension for UUID generation (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- Table: users
-- Maps to: app.models.User
-- Roles: CITIZEN, AUTHORITY, REPAIR_TEAM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'CITIZEN',
    team_id VARCHAR(50),
    unit VARCHAR(100),
    title VARCHAR(100),
    department VARCHAR(100),
    avatar_initials VARCHAR(10) NOT NULL DEFAULT 'CR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==============================================================================
-- Table: reports
-- Maps to: app.models.Report
-- Stores citizen pothole reports, GPS coordinates, and AI detection metadata
-- ==============================================================================
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(50) PRIMARY KEY,
    tracking_number VARCHAR(50) NOT NULL UNIQUE,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    image_path VARCHAR(500) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'LOW',
    ai_status VARCHAR(30) NOT NULL DEFAULT 'UNAVAILABLE',
    ai_detection_json TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    restored_image_path VARCHAR(500),
    rework_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_tracking_number ON reports(tracking_number);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Automatic update of updated_at column on reports modification
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON reports;
CREATE TRIGGER trigger_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- Table: tasks
-- Maps to: app.models.Task
-- Municipal work orders assigned to field repair crews
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    work_order_number VARCHAR(50) NOT NULL UNIQUE,
    report_id VARCHAR(50) NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    assigned_team_id VARCHAR(50) NOT NULL,
    assigned_team_name VARCHAR(150) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    deadline VARCHAR(100),
    instructions TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rework_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_work_order_number ON tasks(work_order_number);
CREATE INDEX IF NOT EXISTS idx_tasks_report_id ON tasks(report_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_team_id ON tasks(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- ==============================================================================
-- Table: repair_evidence
-- Maps to: app.models.RepairEvidence
-- Photographic evidence submitted by repair crews after completing road work
-- ==============================================================================
CREATE TABLE IF NOT EXISTS repair_evidence (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_repair_evidence_task_id ON repair_evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_repair_evidence_uploaded_by_id ON repair_evidence(uploaded_by_id);

-- ==============================================================================
-- Table: status_history
-- Maps to: app.models.StatusHistory
-- Immutable chronological audit log for reports and tasks
-- ==============================================================================
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) REFERENCES reports(id) ON DELETE CASCADE,
    task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_report_id ON status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_status_history_task_id ON status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON status_history(created_at);

-- ==============================================================================
-- Table: notification_events
-- Maps to: app.models.NotificationEvent
-- Outbound notification events prepared for citizens upon defect resolution
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notification_events (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    report_id VARCHAR(50) NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    recipient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'PREPARED',
    payload_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_events_report_id ON notification_events(report_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_recipient_id ON notification_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_delivery_status ON notification_events(delivery_status);
