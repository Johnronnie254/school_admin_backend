import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// No-cache headers for the API route
export const dynamic = 'force-dynamic';
export const revalidate = 0; 