import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    const session = await db.researchSession.findUnique({
      where: { id: taskId },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Research session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      step: session.step,
      progress: session.progress,
      status: session.status,
      logs: session.logs.map(log => ({
        level: log.level,
        message: log.message,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error fetching research status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research status' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const body = await request.json();
    const { step, progress, status } = body;

    const updated = await db.researchSession.update({
      where: { id: taskId },
      data: {
        step: step || undefined,
        progress: progress !== undefined ? progress : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({
      taskId: updated.id,
      step: updated.step,
      progress: updated.progress,
      status: updated.status,
    });
  } catch (error) {
    console.error('Error updating research:', error);
    return NextResponse.json(
      { error: 'Failed to update research' },
      { status: 500 }
    );
  }
}
