/**
 * Auto-Configuration Service
 * Automatically detects and configures available services (Ollama, GROBID)
 * Works even when the backend API is not running by using Tauri shell commands
 */

// Backend API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8234';

// Default service URLs
const DEFAULT_LM_STUDIO_URL = 'http://localhost:1234/v1';
const DEFAULT_GROBID_URL = 'http://localhost:8070';

export interface DetectedServices {
    lm_studio: boolean;
    lm_studio_model?: string;
    backend: boolean;
    grobid: boolean;
}

export interface ServiceConfig {
    lmStudioUrl: string;
    grobidUrl: string;
}

/**
 * Check if we're running in Tauri environment
 */
function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Check LM Studio availability and detect loaded model
 * Returns { available: boolean, model?: string }
 */
export async function checkLmStudio(url: string = DEFAULT_LM_STUDIO_URL): Promise<{ available: boolean; model?: string }> {
    try {
        const { universalFetch } = await import('./universal-fetch');

        const res = await universalFetch(`${url}/models`, {
            method: 'GET',
            timeout: 5000
        });

        if (!res.ok) {
            return { available: false };
        }

        const data = res.data;
        const models = data?.data || [];

        if (models.length === 0) {
            // LM Studio running but no model loaded
            return { available: true, model: undefined };
        }

        // Return first loaded model (LM Studio typically has one at a time)
        const modelId = models[0]?.id || 'unknown';
        console.log('[AutoConfig] LM Studio model detected:', modelId);

        return { available: true, model: modelId };
    } catch (e) {
        console.log('[AutoConfig] LM Studio check failed:', e);
        return { available: false };
    }
}

/**
 * Test LM Studio connection with a simple completion request
 * Returns true if model responds successfully
 */
export async function testLmStudioConnection(url: string = DEFAULT_LM_STUDIO_URL): Promise<{ success: boolean; error?: string; model?: string }> {
    try {
        // First check if available
        const check = await checkLmStudio(url);

        if (!check.available) {
            return { success: false, error: 'Cannot connect to LM Studio. Is it running?' };
        }

        if (!check.model) {
            return { success: false, error: 'LM Studio is running but no model is loaded. Please load a model.' };
        }

        // Try a simple completion to verify model works
        const { universalFetch } = await import('./universal-fetch');

        const testRes = await universalFetch(`${url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                model: check.model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            },
            timeout: 10000
        });

        if (testRes.ok) {
            return { success: true, model: check.model };
        } else {
            const errData = testRes.data;
            return { success: false, error: errData?.error?.message || `HTTP ${testRes.status}`, model: check.model };
        }
    } catch (e: any) {
        return { success: false, error: e?.message || 'Connection failed' };
    }
}


/**
 * Check if backend API is running
 */
export async function checkBackend(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function detectAllServices(): Promise<DetectedServices> {
    console.log('[AutoConfig] Starting service detection...');

    const [backend, lmStudioResult] = await Promise.all([
        checkBackend(),
        checkLmStudio()
    ]);

    const result: DetectedServices = {
        backend,
        lm_studio: lmStudioResult.available,
        lm_studio_model: lmStudioResult.model,
        grobid: backend
    };

    console.log('[AutoConfig] Detection complete:', result);
    return result;
}

/**
 * Auto-configure services based on detection
 * Returns the recommended configuration
 */
export async function autoConfigureServices(): Promise<{
    detected: DetectedServices;
    config: ServiceConfig;
}> {
    const detected = await detectAllServices();

    // Build configuration based on detected services
    const config: ServiceConfig = {
        lmStudioUrl: detected.lm_studio ? DEFAULT_LM_STUDIO_URL : '',
        grobidUrl: detected.grobid ? DEFAULT_GROBID_URL : ''
    };

    console.log('[AutoConfig] Recommended config:', config);

    return { detected, config };
}

/**
 * Save auto-detected configuration to settings
 */
export async function saveAutoConfig(config: ServiceConfig): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ai_provider: {
                    mode: config.lmStudioUrl ? 'lm_studio' : 'auto',
                    lm_studio_url: config.lmStudioUrl
                },
                // Send empty/disabled Neo4j config to keep backend happy/clean
                neo4j: {
                    uri: '',
                    user: 'neo4j',
                    password: ''
                }
            })
        });
        return res.ok;
    } catch (e) {
        console.error('[AutoConfig] Failed to save config:', e);
        return false;
    }
}
