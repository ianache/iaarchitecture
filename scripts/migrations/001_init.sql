-- SQLite migrations for Architecture AI (MVP)
-- File: scripts/migrations/001_init.sql

PRAGMA foreign_keys = ON;

-- Table: models_config
CREATE TABLE IF NOT EXISTS models_config (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  endpoint TEXT,
  on_prem INTEGER DEFAULT 0,
  allowed_sensitive INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Table: evidence_citation
CREATE TABLE IF NOT EXISTS evidence_citation (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  commit_sha TEXT,
  start_line INTEGER,
  end_line INTEGER,
  snippet TEXT,
  score REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Table: variant
CREATE TABLE IF NOT EXISTS variant (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  title TEXT NOT NULL,
  pros_cons_json TEXT,
  metrics_json TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  reviewer TEXT,
  state TEXT NOT NULL,
  comments TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Table: embeddings (simple on-disk storage using JSON for vector)
CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  commit_sha TEXT,
  revision TEXT,
  content_snippet TEXT,
  embedding_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes to speed lookups
CREATE INDEX IF NOT EXISTS idx_embeddings_file_path ON embeddings(file_path);
CREATE INDEX IF NOT EXISTS idx_evidence_package ON evidence_citation(package_id);

-- End of migration
