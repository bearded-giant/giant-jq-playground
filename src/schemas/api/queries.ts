import { z } from 'zod';
import { MAX_JSON_SIZE, MAX_QUERY_SIZE } from '../constants';
import { HttpRequestSchema } from '../domain/http';
import { Options } from '../domain/snippet';

export const SavedQueryCreateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
    json: z.string().max(MAX_JSON_SIZE).optional().nullable(),
    http: HttpRequestSchema.optional().nullable(),
    query: z.string().min(1, 'Query is required').max(MAX_QUERY_SIZE),
    options: Options.optional().nullable(),
}).refine(data => (data.json ? !data.http : !!data.http), {
    message: 'Either JSON or HTTP must be provided.',
    path: ['json', 'http'],
});

export const SavedQueryUpdateSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    json: z.string().max(MAX_JSON_SIZE).optional().nullable(),
    http: HttpRequestSchema.optional().nullable(),
    query: z.string().min(1).max(MAX_QUERY_SIZE).optional(),
    options: Options.optional().nullable(),
});

export const SavedQueryResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    json: z.string().nullable(),
    http: HttpRequestSchema.nullable(),
    query: z.string(),
    options: Options.nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type SavedQueryCreate = z.infer<typeof SavedQueryCreateSchema>;
export type SavedQueryUpdate = z.infer<typeof SavedQueryUpdateSchema>;
export type SavedQueryResponse = z.infer<typeof SavedQueryResponseSchema>;
