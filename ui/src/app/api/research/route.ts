import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Research topic is required' },
        { status: 400 }
      );
    }

    const session = await db.researchSession.create({
      data: {
        topic,
        status: 'running',
        step: 'literature',
        progress: 0,
      },
    });

    return NextResponse.json({
      taskId: session.id,
      status: 'started',
    });
  } catch (error) {
    console.error('Error starting research:', error);
    return NextResponse.json(
      { error: 'Failed to start research' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessions = await db.researchSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
