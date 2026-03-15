const Database = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let db = null;

function initDatabase() {
  if (db) {
    return db;
  }

  // Get database file path
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'whasender.db');

  console.log('Initializing database at:', dbPath);

  // Create database connection
  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Run migrations
  runMigrations();

  return db;
}

function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).sort();

  const getAppliedMigrations = db.prepare('SELECT name FROM _migrations');
  const appliedMigrations = new Set(
    getAppliedMigrations.all().map((row) => row.name)
  );

  const insertMigration = db.prepare(
    'INSERT INTO _migrations (name) VALUES (?)'
  );

  for (const file of migrationFiles) {
    if (!file.endsWith('.sql')) continue;

    if (appliedMigrations.has(file)) {
      console.log(`Migration ${file} already applied, skipping`);
      continue;
    }

    console.log(`Applying migration: ${file}`);
    const migrationPath = path.join(migrationsDir, file);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Disable foreign keys before migration
    db.pragma('foreign_keys = OFF');

    // Run migration in a transaction
    const migrate = db.transaction(() => {
      db.exec(migrationSQL);
      insertMigration.run(file);
    });

    migrate();

    // Re-enable foreign keys after migration
    db.pragma('foreign_keys = ON');

    console.log(`Migration ${file} applied successfully`);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
};
