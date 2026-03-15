-- Migration 002: Add 'paused_limit' status for daily limit handling
-- Foreign keys are automatically disabled by db.js during migrations

-- Step 1: Create new tasks table with updated status constraint
CREATE TABLE IF NOT EXISTS tasks_new (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    status          TEXT CHECK(status IN ('scheduled','running','paused_ban','paused_manual','paused_limit','completed','stopped','failed')) NOT NULL DEFAULT 'scheduled',
    message_template TEXT NOT NULL,
    total_numbers   INTEGER NOT NULL DEFAULT 0,
    sent_count      INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,
    skipped_count   INTEGER DEFAULT 0,
    current_index   INTEGER DEFAULT 0,
    scheduled_at    TEXT,
    started_at      TEXT,
    completed_at    TEXT,
    pause_reason    TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Step 2: Copy data from old table to new table
INSERT INTO tasks_new
SELECT * FROM tasks;

-- Step 3: Drop old table
DROP TABLE tasks;

-- Step 4: Rename new table to original name
ALTER TABLE tasks_new RENAME TO tasks;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON tasks(scheduled_at);
