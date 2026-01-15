/**
 * Auto-Configuration Service
 * Automatically detects and configures available services (Ollama, GROBID)
 * Works even when the backend API is not running by using Tauri shell commands
 */

// Backend API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8234';

// Default service URLs
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_GROBID_URL = 'http://localhost:8070';

export interface DetectedServices {
    ollama: boolean;
    ollamaModels: string[];
    grobid: boolean;
    backend: boolean;
}

export interface ServiceConfig {
    ollamaUrl: string;
    ollamaModel: string;
    grobidUrl: string;
}

/**
 * Check if we're running in Tauri environment
 */
function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Check Ollama via backend API
 */
async function checkOllamaViaBackend(url: string): Promise<{ available: boolean; models: string[] }> {
    try {
        const res = await fetch(`${API_BASE}/api/settings/ollama/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base_url: url }),
            signal: AbortSignal.timeout(3000)
        });

        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success') {
                return { available: true, models: data.models || [] };
            }
        }
    } catch (e) {
        console.log('[AutoConfig] Backend Ollama check failed:', e);
    }
    return { available: false, models: [] };
}

/**
 * Check Ollama via Tauri shell command (fallback when backend unavailable)
 */
async function checkOllamaViaTauri(url: string): Promise<{ available: boolean; models: string[] }> {
    if (!isTauri()) {
        return { available: false, models: [] };
    }

    try {
        const { Command } = await import('@tauri-apps/api/shell');

        // First check if Ollama is responding
        const pingCmd = new Command('curl', ['-s', '-m', '2', `${url}/api/tags`]);
        const pingResult = await pingCmd.execute();

        if (pingResult.code === 0 && pingResult.stdout) {
            try {
                const data = JSON.parse(pingResult.stdout);
                const models = (data.models || []).map((m: any) => m.name || m);
                return { available: true, models };
            } catch {
                // Response not JSON, but Ollama is running
                return { available: true, models: [] };
            }
        }
    } catch (e) {
        console.log('[AutoConfig] Tauri Ollama check failed:', e);
    }
    return { available: false, models: [] };
}

/**
 * Check Ollama availability with fallback
 */
export async function checkOllama(url: string = DEFAULT_OLLAMA_URL): Promise<{ available: boolean; models: string[] }> {
    // Try backend first
    const backendResult = await checkOllamaViaBackend(url);
    if (backendResult.available) {
        console.log('[AutoConfig] Ollama detected via backend');
        return backendResult;
    }

    // Fallback to Tauri shell
    const tauriResult = await checkOllamaViaTauri(url);
    if (tauriResult.available) {
        console.log('[AutoConfig] Ollama detected via Tauri shell');
        return tauriResult;
    }

    console.log('[AutoConfig] Ollama not detected');
    return { available: false, models: [] };
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

    const [backend, ollamaResult] = await Promise.all([
        checkBackend(),
        checkOllama()
    ]);

    const result: DetectedServices = {
        backend,
        ollama: ollamaResult.available,
        ollamaModels: ollamaResult.models,
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
        ollamaUrl: detected.ollama ? DEFAULT_OLLAMA_URL : '',
        ollamaModel: detected.ollamaModels.length > 0 ? detected.ollamaModels[0] : '',
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
                    mode: config.ollamaUrl ? 'ollama' : 'auto',
                    ollama_url: config.ollamaUrl,
                    ollama_model: config.ollamaModel
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
