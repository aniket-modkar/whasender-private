-- Create contacts master table for storing reusable contacts
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  tags TEXT, -- JSON array of tags
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);

-- Create index on name for search
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
