import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/lab/report - Generate report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, template } = body;

    if (!taskId || !template) {
      return NextResponse.json(
        { error: 'taskId and template are required' },
        { status: 400 }
      );
    }

    const { generateReport } = await import('@/lib/lab-interface');
    const result = generateReport(taskId, template);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
