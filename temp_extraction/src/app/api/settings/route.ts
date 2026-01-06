import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory settings store (in production, use database)
const settingsStore: Map<string, any> = new Map();

// Default settings
const defaultSettings = {
  llmProvider: 'auto',
  ollamaUrl: 'http://localhost:11434',
  maxPapers: 50,
  outputLanguage: 'en',
  theme: 'auto',
  defaultResearchMode: 'synthesize',
  compactMode: false,
  animationsEnabled: true
};

// Initialize with defaults
Object.entries(defaultSettings).forEach(([key, value]) => {
  if (!settingsStore.has(key)) {
    settingsStore.set(key, value);
  }
});

// GET - Get all settings
export async function GET() {
  const settings: Record<string, any> = {};

  for (const [key, value] of settingsStore.entries()) {
    settings[key] = value;
  }

  return NextResponse.json(settings);
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Update only provided settings
    for (const [key, value] of Object.entries(body)) {
      settingsStore.set(key, value);
      console.log(`✅ Setting updated: ${key} = ${value}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: Object.fromEntries(settingsStore)
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
