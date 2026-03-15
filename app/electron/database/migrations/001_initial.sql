-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    status          TEXT CHECK(status IN ('scheduled','running','paused_ban','paused_manual','completed','stopped','failed')) NOT NULL DEFAULT 'scheduled',
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

-- Task numbers table
CREATE TABLE IF NOT EXISTS task_numbers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    phone       TEXT NOT NULL,
    name        TEXT DEFAULT '',
    status      TEXT CHECK(status IN ('pending','sent','failed','skipped')) DEFAULT 'pending',
    sent_at     TEXT,
    error       TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     INTEGER REFERENCES tasks(id),
    level       TEXT CHECK(level IN ('info','warn','error','ban')) DEFAULT 'info',
    message     TEXT NOT NULL,
    timestamp   TEXT DEFAULT (datetime('now'))
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_numbers_task_id ON task_numbers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_numbers_status ON task_numbers(status);
CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
