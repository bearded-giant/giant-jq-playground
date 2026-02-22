import { NextResponse } from 'next/server';
import { SnippetError } from '@/schemas/api';

export async function GET(): Promise<NextResponse<SnippetError>> {
    return NextResponse.json({ error: 'Snippet sharing is not available' }, { status: 501 });
}
