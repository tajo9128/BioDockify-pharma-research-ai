import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/settings - Get settings
export async function GET() {
  try {
    const { getSettings } = await import('@/lib/settings-manager');
    const settings = getSettings();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// POST /api/v1/settings - Save settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saveSettings } = await import('@/lib/settings-manager');
    saveSettings(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
