-- Create contact groups table
CREATE TABLE IF NOT EXISTS contact_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Junction table: which contacts belong to which group
CREATE TABLE IF NOT EXISTS contact_group_members (
  group_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  added_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, contact_id),
  FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cgm_group_id ON contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_cgm_contact_id ON contact_group_members(contact_id);
