import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }, { status: 200 });
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic'; 