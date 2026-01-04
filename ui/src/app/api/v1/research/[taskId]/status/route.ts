import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/research/[taskId]/status - Get research task status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const { getResearchStatus } = await import('@/lib/research-manager');
    const status = getResearchStatus(taskId);

    if (!status) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting research status:', error);
    return NextResponse.json(
      { error: 'Failed to get research status' },
      { status: 500 }
    );
  }
}
