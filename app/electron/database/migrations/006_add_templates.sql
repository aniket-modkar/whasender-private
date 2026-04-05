CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL DEFAULT 'text',
  message_body TEXT DEFAULT '',
  media_path TEXT DEFAULT NULL,
  media_filename TEXT DEFAULT NULL,
  media_size INTEGER DEFAULT NULL,
  media_caption TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
