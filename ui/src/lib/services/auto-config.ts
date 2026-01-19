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
 * Check LM Studio availability (Standard OpenAI-compatible endpoint)
 */
export async function checkLmStudio(url: string = DEFAULT_LM_STUDIO_URL): Promise<boolean> {
    try {
        // Simple fetch check since LM Studio mimics OpenAI
        const res = await fetch(`${url}/models`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        return res.ok;
    } catch {
        return false;
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

/**
 * Detect all available services
 */
export async function detectAllServices(): Promise<DetectedServices> {
    console.log('[AutoConfig] Starting service detection...');

    const [backend, lmStudio] = await Promise.all([
        checkBackend(),
        checkLmStudio()
    ]);

    const result: DetectedServices = {
        backend,
        lm_studio: lmStudio,
        grobid: backend // GROBID check requires backend for now
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
