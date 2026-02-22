import { describe, it, expect } from 'vitest';
import { SavedQueryCreateSchema, SavedQueryUpdateSchema } from './queries';

describe('SavedQueryCreateSchema', () => {
    it('accepts valid json input', () => {
        const result = SavedQueryCreateSchema.safeParse({
            name: 'my query',
            json: '{"a":1}',
            query: '.a',
            options: ['-r'],
        });
        expect(result.success).toBe(true);
    });

    it('accepts valid http input', () => {
        const result = SavedQueryCreateSchema.safeParse({
            name: 'http query',
            http: { method: 'GET', url: 'https://example.com/data.json' },
            query: '.results',
        });
        expect(result.success).toBe(true);
    });

    it('rejects when both json and http are provided', () => {
        const result = SavedQueryCreateSchema.safeParse({
            name: 'both',
            json: '{}',
            http: { method: 'GET', url: 'https://example.com' },
            query: '.',
        });
        expect(result.success).toBe(false);
    });

    it('rejects when neither json nor http is provided', () => {
        const result = SavedQueryCreateSchema.safeParse({
            name: 'neither',
            query: '.',
        });
        expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
        const result = SavedQueryCreateSchema.safeParse({
            name: '',
            json: '{}',
            query: '.',
        });
        expect(result.success).toBe(false);
    });

    it('rejects missing query', () => {
        const result = SavedQueryCreateSchema.safeParse({
            name: 'no query',
            json: '{}',
        });
        expect(result.success).toBe(false);
    });
});

describe('SavedQueryUpdateSchema', () => {
    it('accepts partial updates', () => {
        const result = SavedQueryUpdateSchema.safeParse({ name: 'renamed' });
        expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
        const result = SavedQueryUpdateSchema.safeParse({});
        expect(result.success).toBe(true);
    });
});
