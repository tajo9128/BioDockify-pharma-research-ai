import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/research/start - Start a new research task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate task ID
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Import and use the research module
    const { startResearchTask } = await import('@/lib/research-manager');
    startResearchTask(taskId, topic);

    return NextResponse.json({ taskId });
  } catch (error) {
    console.error('Error starting research:', error);
    return NextResponse.json(
      { error: 'Failed to start research' },
      { status: 500 }
    );
  }
}
