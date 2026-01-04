import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/research/[taskId]/results - Get research results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const { getResearchResults } = await import('@/lib/research-manager');
    const results = getResearchResults(taskId);

    if (!results) {
      return NextResponse.json(
        { error: 'Results not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error getting research results:', error);
    return NextResponse.json(
      { error: 'Failed to get research results' },
      { status: 500 }
    );
  }
}
