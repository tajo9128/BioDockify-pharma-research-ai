import { NextResponse } from 'next/server';

// GET /api/v1/lab/exports - Get recent exports
export async function GET() {
  try {
    const { getRecentExports } = await import('@/lib/lab-interface');
    const exports = getRecentExports();

    return NextResponse.json(exports);
  } catch (error) {
    console.error('Error getting exports:', error);
    return NextResponse.json(
      { error: 'Failed to get exports' },
      { status: 500 }
    );
  }
}
