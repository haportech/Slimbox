import test from 'node:test';
import assert from 'node:assert';
import db from '../src/lib/db';

test('Database initialization', () => {
  const stmt = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'');
  const tables = stmt.all() as { name: string }[];
  
  const tableNames = tables.map(t => t.name);
  assert(tableNames.includes('sessions'), 'sessions table should exist');
  assert(tableNames.includes('requests'), 'requests table should exist');
  assert(tableNames.includes('settings'), 'settings table should exist');
});

test('Session insertion', () => {
  const sessionId = 'test-session-' + Date.now();
  db.prepare('INSERT INTO sessions (id, agent_id) VALUES (?, ?)').run(sessionId, 'test-agent');
  
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as { id: string, agent_id: string, original_prompt: string | null };
  assert.strictEqual(session.agent_id, 'test-agent');
  assert.strictEqual(session.original_prompt, null, 'original_prompt should be null by default');
});

test('Settings insertion and retrieval', () => {
  const key = 'test_key_' + Date.now();
  const value = 'test_value';
  
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string };
  
  assert.strictEqual(setting.value, value);
});
