-- =============================================================
-- PART 16 — Database Schema (PostgreSQL)
-- Run once to initialize all tables and indexes
-- =============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name       TEXT,
  role            TEXT DEFAULT 'officer',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  filename        TEXT NOT NULL,
  file_hash       TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type       TEXT,
  status          TEXT DEFAULT 'pending',
  celery_task_id  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Validation Results
CREATE TABLE IF NOT EXISTS validation_results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id          UUID REFERENCES documents(id) ON DELETE CASCADE,
  filename             TEXT NOT NULL,
  file_hash            TEXT,
  forgery_score        INTEGER,
  status               TEXT,
  layout_score         INTEGER,
  seal_position        TEXT,
  text_alignment       TEXT,
  logo_integrity       TEXT,
  morph_hash           TEXT,
  institution          TEXT,
  issue_date           TEXT,
  certificate_type     TEXT,
  verification_method  TEXT,
  qr_data              TEXT,
  ocr_text_sample      TEXT,
  ela_score            FLOAT,
  noise_score          FLOAT,
  forensic_verdict     TEXT,
  forensic_score       INTEGER,
  compliance_score     INTEGER,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vr_file_hash   ON validation_results (file_hash);
CREATE INDEX IF NOT EXISTS idx_vr_status      ON validation_results (status);
CREATE INDEX IF NOT EXISTS idx_vr_created_at  ON validation_results (created_at DESC);

-- Anomalies
CREATE TABLE IF NOT EXISTS anomalies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id      UUID REFERENCES validation_results(id) ON DELETE CASCADE,
  anomaly_type   TEXT,
  area           TEXT,
  confidence     INTEGER,
  reason         TEXT,
  severity       TEXT,
  bbox_x         INTEGER,
  bbox_y         INTEGER,
  bbox_width     INTEGER,
  bbox_height    INTEGER
);

-- Chat History (also mirrored to Supabase)
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  source     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_session    ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages (created_at DESC);
