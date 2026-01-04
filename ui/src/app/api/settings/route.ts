import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: {
          llmMode: 'local',
          ollamaUrl: 'http://localhost:11434',
          neo4jHost: 'bolt://localhost:7687',
          apiBaseUrl: 'http://localhost:8000',
        },
      });
    }

    const { openaiApiKey, neo4jPassword, ...safeSettings } = settings;

    return NextResponse.json({
      ...safeSettings,
      openaiApiKey: openaiApiKey ? '••••••••' : '',
      neo4jPassword: neo4jPassword ? '••••••••' : '',
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: body,
      });
    } else {
      settings = await db.settings.update({
        where: { id: settings.id },
        data: body,
      });
    }

    return NextResponse.json({
      id: settings.id,
      llmMode: settings.llmMode,
      ollamaUrl: settings.ollamaUrl,
      selectedModel: settings.selectedModel,
      neo4jHost: settings.neo4jHost,
      neo4jUsername: settings.neo4jUsername,
      apiBaseUrl: settings.apiBaseUrl,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
