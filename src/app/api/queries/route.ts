import { ZodError } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { SavedQueryCreateSchema } from '@/schemas/api';
import { listQueries, createQuery, SavedQueryRow } from '@/lib/queries-db';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse<T>(data: T, status: number): Response {
    return Response.json(data, { status, headers: CORS_HEADERS });
}

function serializeRow(row: SavedQueryRow) {
    return {
        ...row,
        http: row.http ? JSON.parse(row.http) : null,
        options: row.options ? JSON.parse(row.options) : null,
    };
}

function handleError(e: unknown): Response {
    if (e instanceof ZodError) {
        return jsonResponse({ error: e.errors }, 422);
    }
    if (e instanceof SyntaxError) {
        return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }
    Sentry.captureException(e);
    const message = e instanceof Error ? e.message : 'An unknown error occurred';
    return jsonResponse({ error: message }, 500);
}

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
    try {
        const rows = listQueries();
        return jsonResponse(rows.map(serializeRow), 200);
    } catch (e: unknown) {
        return handleError(e);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = SavedQueryCreateSchema.parse(body);

        const row = createQuery({
            name: data.name,
            json: data.json ?? null,
            http: data.http ? JSON.stringify(data.http) : null,
            query: data.query,
            options: data.options ? JSON.stringify(data.options) : null,
        });

        return jsonResponse(serializeRow(row), 201);
    } catch (e: unknown) {
        return handleError(e);
    }
}
