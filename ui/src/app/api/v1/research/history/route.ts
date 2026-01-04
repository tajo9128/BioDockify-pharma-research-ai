import { NextResponse } from 'next/server';

// GET /api/v1/research/history - Get research history
export async function GET() {
  try {
    const { getResearchHistory } = await import('@/lib/research-manager');
    const history = getResearchHistory();

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error getting research history:', error);
    return NextResponse.json(
      { error: 'Failed to get research history' },
      { status: 500 }
    );
  }
}
