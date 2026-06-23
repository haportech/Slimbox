import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'slimbox.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize schema
try {
  db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    original_tokens INTEGER DEFAULT 0,
    compressed_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    payload_diff TEXT,
    routing_decision TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);
} catch (err: unknown) {
  if (err instanceof Error && (err as { code?: string }).code !== 'SQLITE_BUSY') {
    console.error('Database initialization error:', err);
  }
}

export default db;
