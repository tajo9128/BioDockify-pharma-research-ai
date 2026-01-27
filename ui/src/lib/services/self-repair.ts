/**
 * Agent Zero Self-Repair Service
 * Automatically detects and fixes configuration issues
 * Provides intelligent retry logic and alternative configurations
 */

// LM Studio default and alternative ports
const LM_STUDIO_PORTS = [1234, 1235, 8080, 8000];
const DEFAULT_TIMEOUT = 5000; // Increased from 3000ms

export interface RepairResult {
    success: boolean;
    action: string;
    details: string;
    newConfig?: Record<string, any>;
}

export interface ServiceStatus {
    name: string;
    available: boolean;
    url?: string;
    error?: string;
    model?: string;
}

/**
 * Enhanced LM Studio detection with multiple retry and port scanning
 */
export async function detectLmStudioEnhanced(): Promise<ServiceStatus> {
    console.log('[SelfRepair] Starting enhanced LM Studio detection...');

    // Try each port
    for (const port of LM_STUDIO_PORTS) {
        const url = `http://localhost:${port}/v1`;
        console.log(`[SelfRepair] Trying LM Studio on port ${port}...`);

        try {
            const result = await fetchWithRetry(`${url}/models`, 3, DEFAULT_TIMEOUT);

            if (result.ok) {
                const data = await result.json();
                const models = data?.data || [];
                const model = models[0]?.id;

                console.log(`[SelfRepair] LM Studio found on port ${port}!`, { model });

                return {
                    name: 'LM Studio',
                    available: true,
                    url: url,
                    model: model || undefined
                };
            }
        } catch (e) {
            console.log(`[SelfRepair] Port ${port} failed:`, e);
        }
    }

    // All ports failed
    return {
        name: 'LM Studio',
        available: false,
        error: 'Could not connect on any port (1234, 1235, 8080, 8000)'
    };
}

/**
 * Fetch with automatic retry using universalFetch for CORS bypass
 */
async function fetchWithRetry(
    url: string,
    maxRetries: number = 3,
    timeout: number = DEFAULT_TIMEOUT
): Promise<{ ok: boolean; json: () => Promise<any>; data?: any }> {
    const { universalFetch } = await import('./universal-fetch');
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[SelfRepair] Fetch attempt ${attempt}/${maxRetries}: ${url}`);

            const response = await universalFetch(url, {
                method: 'GET',
                timeout
            });

            return response;

        } catch (e: any) {
            lastError = e;
            console.log(`[SelfRepair] Attempt ${attempt} failed: ${e.message}`);

            if (attempt < maxRetries) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    throw lastError || new Error('All retries failed');
}

/**
 * Self-repair: Fix LM Studio configuration issues
 */
export async function repairLmStudioConfig(): Promise<RepairResult> {
    console.log('[SelfRepair] Starting LM Studio repair...');

    // Step 1: Enhanced detection
    const status = await detectLmStudioEnhanced();

    if (status.available) {
        return {
            success: true,
            action: 'auto_detected',
            details: `LM Studio found at ${status.url}${status.model ? ` with model: ${status.model}` : ''}`,
            newConfig: {
                lm_studio_url: status.url,
                lm_studio_model: status.model
            }
        };
    }

    // Step 2: Check if LM Studio process is running (via backend if available)
    const processCheck = await checkLmStudioProcess();

    if (processCheck.running && !processCheck.serverReady) {
        return {
            success: false,
            action: 'server_not_ready',
            details: 'LM Studio is running but the local server is not started. Please enable "Start Server" in LM Studio.'
        };
    }

    if (!processCheck.running) {
        return {
            success: false,
            action: 'not_running',
            details: 'LM Studio is not running. Please start LM Studio and load a model.'
        };
    }

    return {
        success: false,
        action: 'unknown_error',
        details: 'Could not detect LM Studio. Check if it\'s running on the default port (1234).'
    };
}

/**
 * Check if LM Studio process is running via backend
 */
async function checkLmStudioProcess(): Promise<{ running: boolean; serverReady: boolean }> {
    try {
        const API_BASE = typeof window !== 'undefined'
            ? (window as any).__BIODOCKIFY_API_URL__ || 'http://localhost:8234'
            : 'http://localhost:8234';
        const res = await fetch(`${API_BASE}/api/system/check-process?name=LM Studio`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });

        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.log('[SelfRepair] Backend process check unavailable');
    }

    // Fallback: assume not running if we can't check
    return { running: false, serverReady: false };
}

/**
 * Run full self-repair diagnostics
 */
export async function runSelfRepairDiagnostics(): Promise<{
    lmStudio: RepairResult;
    backend: ServiceStatus;
    recommendations: string[];
}> {
    console.log('[SelfRepair] Running full diagnostics...');

    // Check LM Studio
    const lmStudio = await repairLmStudioConfig();

    // Check Backend
    const backend = await checkBackend();

    // Generate recommendations
    const recommendations: string[] = [];

    if (!lmStudio.success) {
        recommendations.push('Start LM Studio and enable the local server on port 1234');
        recommendations.push('Load a model in LM Studio before detection');
    }

    if (!backend.available) {
        recommendations.push('The BioDockify backend is not running - some features may be limited');
    }

    return {
        lmStudio,
        backend,
        recommendations
    };
}

/**
 * Check backend API status
 */
async function checkBackend(): Promise<ServiceStatus> {
    try {
        const API_BASE = typeof window !== 'undefined'
            ? (window as any).__BIODOCKIFY_API_URL__ || 'http://localhost:8234'
            : 'http://localhost:8234';
        const res = await fetch(`${API_BASE}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });

        return {
            name: 'Backend API',
            available: res.ok,
            url: API_BASE
        };
    } catch {
        return {
            name: 'Backend API',
            available: false,
            error: 'Cannot connect to backend'
        };
    }
}

/**
 * Auto-fix configuration based on detected issues
 */
export async function autoFixConfiguration(): Promise<{
    fixed: boolean;
    changes: string[];
}> {
    const changes: string[] = [];

    // Try to detect and fix LM Studio
    const lmResult = await detectLmStudioEnhanced();

    if (lmResult.available && lmResult.url) {
        // Save to localStorage for persistence
        if (typeof window !== 'undefined') {
            localStorage.setItem('biodockify_lm_studio_url', lmResult.url);
            if (lmResult.model) {
                localStorage.setItem('biodockify_lm_studio_model', lmResult.model);
            }
            changes.push(`Auto-configured LM Studio URL: ${lmResult.url}`);
        }
    }

    return {
        fixed: changes.length > 0,
        changes
    };
}
