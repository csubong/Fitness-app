import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const uploadsDir = path.join(dataDir, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, 'fitness.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS food_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    name TEXT NOT NULL,
    calories REAL,
    protein_g REAL,
    carbs_g REAL,
    fat_g REAL,
    portion TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    photo_path TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS water_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    amount_oz REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    workout_type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    duration_min REAL,
    distance TEXT,
    sets_reps TEXT,
    weight TEXT,
    perceived_effort INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_food_timestamp ON food_entries (timestamp);
  CREATE INDEX IF NOT EXISTS idx_water_timestamp ON water_entries (timestamp);
  CREATE INDEX IF NOT EXISTS idx_workouts_timestamp ON workouts (timestamp);
`);

// Default daily water goal: 64oz (8x 8oz glasses), only set if not already present.
const defaultSettings = { water_goal_oz: '64' };
const insertDefault = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);
for (const [key, value] of Object.entries(defaultSettings)) {
  insertDefault.run(key, value);
}

export { uploadsDir };
