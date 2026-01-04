import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/lab/protocol - Generate protocol
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, type } = body;

    if (!taskId || !type) {
      return NextResponse.json(
        { error: 'taskId and type are required' },
        { status: 400 }
      );
    }

    const { generateProtocol } = await import('@/lib/lab-interface');
    const result = generateProtocol(taskId, type);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating protocol:', error);
    return NextResponse.json(
      { error: 'Failed to generate protocol' },
      { status: 500 }
    );
  }
}
