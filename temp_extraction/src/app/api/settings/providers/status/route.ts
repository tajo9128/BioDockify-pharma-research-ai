import { NextRequest, NextResponse } from 'next/server';
import { getProviderSelector } from '@/lib/llm/provider-selector';

// GET - Check status of all providers
export async function GET(request: NextRequest) {
  try {
    const selector = getProviderSelector();
    const status = await selector.getProvidersStatus();

    // Get preferred provider
    const preferred = selector.getPreferredProvider();

    return NextResponse.json({
      providers: status,
      preferredProvider: preferred,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking provider status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check provider status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Update provider preference
export async function POST(request: NextRequest) {
  try {
    const { preferredProvider, enableProvider, disableProvider } = await request.json();

    const selector = getProviderSelector();

    // Set preferred provider
    if (preferredProvider) {
      selector.setPreferredProvider(preferredProvider);
      console.log(`✅ Preferred provider set to: ${preferredProvider}`);
    }

    // Enable/disable providers
    if (enableProvider) {
      selector.setProviderEnabled(enableProvider, true);
    }

    if (disableProvider) {
      selector.setProviderEnabled(disableProvider, false);
    }

    const status = await selector.getProvidersStatus();

    return NextResponse.json({
      success: true,
      message: 'Provider settings updated',
      providers: status,
      preferredProvider: selector.getPreferredProvider()
    });
  } catch (error) {
    console.error('Error updating provider settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update provider settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
