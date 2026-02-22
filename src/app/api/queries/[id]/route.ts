import { ZodError } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { SavedQueryUpdateSchema } from '@/schemas/api';
import { getQuery, updateQuery, deleteQuery, SavedQueryRow } from '@/lib/queries-db';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const row = getQuery(id);
        if (!row) return jsonResponse({ error: 'Query not found' }, 404);
        return jsonResponse(serializeRow(row), 200);
    } catch (e: unknown) {
        return handleError(e);
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = SavedQueryUpdateSchema.parse(body);

        const updates: Record<string, unknown> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.json !== undefined) updates.json = data.json;
        if (data.http !== undefined) updates.http = data.http ? JSON.stringify(data.http) : null;
        if (data.query !== undefined) updates.query = data.query;
        if (data.options !== undefined) updates.options = data.options ? JSON.stringify(data.options) : null;

        const row = updateQuery(id, updates);
        if (!row) return jsonResponse({ error: 'Query not found' }, 404);
        return jsonResponse(serializeRow(row), 200);
    } catch (e: unknown) {
        return handleError(e);
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deleted = deleteQuery(id);
        if (!deleted) return jsonResponse({ error: 'Query not found' }, 404);
        return jsonResponse({ success: true }, 200);
    } catch (e: unknown) {
        return handleError(e);
    }
}
