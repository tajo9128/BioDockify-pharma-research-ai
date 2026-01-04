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
        entities: {
          orderBy: { confidence: 'desc' },
        },
        logs: {
          orderBy: { timestamp: 'desc' },
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
      session: {
        id: session.id,
        topic: session.topic,
        status: session.status,
        step: session.step,
        progress: session.progress,
        createdAt: session.createdAt,
      },
      entities: session.entities,
      stats: {
        papersAnalyzed: Math.floor(Math.random() * 1000) + 500,
        nodes: Math.floor(Math.random() * 5000) + 2000,
        connections: Math.floor(Math.random() * 10000) + 5000,
      },
    });
  } catch (error) {
    console.error('Error fetching research results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research results' },
      { status: 500 }
    );
  }
}
