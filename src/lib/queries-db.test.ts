import { describe, it, expect, beforeEach } from 'vitest';

// use in-memory sqlite for tests
process.env.QUERIES_DB_PATH = ':memory:';

import { getDb, listQueries, getQuery, createQuery, updateQuery, deleteQuery, _resetDb } from './queries-db';

beforeEach(() => {
    _resetDb();
});

describe('queries-db', () => {
    it('initializes database with saved_queries table', () => {
        const db = getDb();
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='saved_queries'").all();
        expect(tables).toHaveLength(1);
    });

    it('creates and retrieves a query with json input', () => {
        const row = createQuery({
            name: 'test query',
            json: '{"a":1}',
            query: '.a',
            options: '["-r"]',
        });

        expect(row.id).toBeDefined();
        expect(row.name).toBe('test query');
        expect(row.json).toBe('{"a":1}');
        expect(row.http).toBeNull();
        expect(row.query).toBe('.a');
        expect(row.options).toBe('["-r"]');
        expect(row.created_at).toBeDefined();
        expect(row.updated_at).toBeDefined();

        const fetched = getQuery(row.id);
        expect(fetched).toEqual(row);
    });

    it('creates a query with http input', () => {
        const http = JSON.stringify({ method: 'GET', url: 'https://example.com/data.json' });
        const row = createQuery({
            name: 'http query',
            http,
            query: '.results',
        });

        expect(row.json).toBeNull();
        expect(row.http).toBe(http);
    });

    it('lists queries ordered by updated_at DESC', () => {
        const first = createQuery({ name: 'first', json: '{}', query: '.' });
        const second = createQuery({ name: 'second', json: '{}', query: '.b' });

        // update first so it has a newer updated_at
        updateQuery(first.id, { name: 'first-updated' });

        const list = listQueries();
        expect(list.length).toBe(2);
        expect(list[0].name).toBe('first-updated');
        expect(list[1].name).toBe('second');
    });

    it('updates a query partially', () => {
        const row = createQuery({ name: 'original', json: '{}', query: '.' });
        const updated = updateQuery(row.id, { name: 'renamed' });

        expect(updated).toBeDefined();
        expect(updated!.name).toBe('renamed');
        expect(updated!.query).toBe('.');
        expect(updated!.json).toBe('{}');
    });

    it('returns undefined when updating nonexistent query', () => {
        const result = updateQuery('nonexistent-id', { name: 'nope' });
        expect(result).toBeUndefined();
    });

    it('deletes a query', () => {
        const row = createQuery({ name: 'to-delete', json: '{}', query: '.' });
        expect(deleteQuery(row.id)).toBe(true);
        expect(getQuery(row.id)).toBeUndefined();
    });

    it('returns false when deleting nonexistent query', () => {
        expect(deleteQuery('nonexistent-id')).toBe(false);
    });
});
