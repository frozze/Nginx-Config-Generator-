import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const payload = await request.json().catch(() => null);

        if (!payload || typeof payload.event !== 'string') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Failed to process analytics event' }, { status: 500 });
    }
}
