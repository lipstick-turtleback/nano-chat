import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'lexichat.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    -- Players
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY DEFAULT 'default',
      display_name TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat Sessions
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      messages TEXT NOT NULL,
      message_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      knowledge_extracted BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    -- Knowledge Store (per player + companion)
    CREATE TABLE IF NOT EXISTS knowledge_store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, companion_id, key)
    );

    -- Companion Progress
    CREATE TABLE IF NOT EXISTS companion_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      sessions_completed INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      level TEXT DEFAULT 'beginner',
      data TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, companion_id)
    );

    -- DnD Campaigns
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DnD Characters
    CREATE TABLE IF NOT EXISTS dnd_characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      hp INTEGER NOT NULL,
      max_hp INTEGER NOT NULL,
      ac INTEGER NOT NULL,
      stats TEXT NOT NULL,
      inventory TEXT NOT NULL,
      abilities TEXT NOT NULL,
      backstory TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DnD Scene Log
    CREATE TABLE IF NOT EXISTS dnd_scene_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      character_id INTEGER REFERENCES dnd_characters(id),
      scene_number INTEGER DEFAULT 1,
      narrative TEXT NOT NULL,
      player_action TEXT NOT NULL,
      action_type TEXT,
      roll_notation TEXT,
      roll_result INTEGER,
      dc INTEGER,
      outcome TEXT,
      state_snapshot TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TTS Cache
    CREATE TABLE IF NOT EXISTS tts_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text_hash TEXT NOT NULL UNIQUE,
      voice TEXT NOT NULL,
      file_path TEXT NOT NULL,
      text_preview TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Game Sessions
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      game_type TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default player if not exists
    INSERT OR IGNORE INTO players (id) VALUES ('default');
  `);
}

export default db;
