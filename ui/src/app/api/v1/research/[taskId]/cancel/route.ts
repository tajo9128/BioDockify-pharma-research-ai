import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/research/[taskId]/cancel - Cancel research task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const { cancelResearch } = await import('@/lib/research-manager');
    cancelResearch(taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling research:', error);
    return NextResponse.json(
      { error: 'Failed to cancel research' },
      { status: 500 }
    );
  }
}
