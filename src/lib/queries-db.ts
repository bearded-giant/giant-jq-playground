import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

declare global {
    var queriesDb: Database.Database | undefined;
}

function getDbPath(): string {
    return process.env.QUERIES_DB_PATH || path.join(process.cwd(), 'data', 'queries.db');
}

export function getDb(): Database.Database {
    if (global.queriesDb) return global.queriesDb;

    const dbPath = getDbPath();
    if (dbPath !== ':memory:') {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    db.exec(`
        CREATE TABLE IF NOT EXISTS saved_queries (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            json TEXT,
            http TEXT,
            query TEXT NOT NULL,
            options TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    if (process.env.NODE_ENV !== 'production') {
        global.queriesDb = db;
    }

    return db;
}

export interface SavedQueryRow {
    id: string;
    name: string;
    json: string | null;
    http: string | null;
    query: string;
    options: string | null;
    created_at: string;
    updated_at: string;
}

export function listQueries(): SavedQueryRow[] {
    return getDb().prepare('SELECT * FROM saved_queries ORDER BY updated_at DESC').all() as SavedQueryRow[];
}

export function getQuery(id: string): SavedQueryRow | undefined {
    return getDb().prepare('SELECT * FROM saved_queries WHERE id = ?').get(id) as SavedQueryRow | undefined;
}

export function createQuery(data: { name: string; json?: string | null; http?: string | null; query: string; options?: string | null }): SavedQueryRow {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    getDb().prepare(
        'INSERT INTO saved_queries (id, name, json, http, query, options, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.name, data.json ?? null, data.http ?? null, data.query, data.options ?? null, now, now);
    return getQuery(id)!;
}

export function updateQuery(id: string, data: Partial<{ name: string; json: string | null; http: string | null; query: string; options: string | null }>): SavedQueryRow | undefined {
    const existing = getQuery(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    getDb().prepare(`UPDATE saved_queries SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getQuery(id)!;
}

export function deleteQuery(id: string): boolean {
    const result = getDb().prepare('DELETE FROM saved_queries WHERE id = ?').run(id);
    return result.changes > 0;
}

export function _resetDb(): void {
    if (global.queriesDb) {
        global.queriesDb.close();
        global.queriesDb = undefined;
    }
}
