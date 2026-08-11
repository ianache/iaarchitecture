export const SCHEMA = `
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  requirements TEXT NOT NULL,
  knowledge_revision TEXT NOT NULL,
  status TEXT NOT NULL,
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  decision_json TEXT NOT NULL,
  significant INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  action TEXT NOT NULL,
  comment TEXT,
  at TEXT NOT NULL,
  FOREIGN KEY (decision_id) REFERENCES decisions(id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id TEXT NOT NULL,
  event_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (decision_id) REFERENCES decisions(id)
);
CREATE TABLE IF NOT EXISTS analysis_result_versions (
  analysis_id TEXT NOT NULL,
  generation INTEGER NOT NULL,
  result_json TEXT NOT NULL,
  archived_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  PRIMARY KEY (analysis_id, generation),
  FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);
`;
