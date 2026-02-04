/**
 * Cross-Platform Fetch Wrapper
 * Uses Tauri's HTTP client when in desktop app, browser fetch otherwise.
 * This bypasses CORS issues that affect the Tauri webview.
 */

// Check if we're in Tauri environment
export function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
}

interface FetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string | object;
    timeout?: number;
}

interface FetchResult {
    ok: boolean;
    status: number;
    data: any;
    json: () => Promise<any>;
}

/**
 * Universal fetch that works in both Tauri and browser environments
 */
export async function universalFetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    const { method = 'GET', headers = {}, body, timeout = 5000 } = options;

    if (isTauri()) {
        // Use Tauri's HTTP client (bypasses CORS)
        try {
            // @ts-ignore - Tauri types may not be available at compile time
            const { fetch: tauriFetch, Body } = await import('@tauri-apps/api/http');

            const payload = body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined;
            const requestBody = payload ? Body.json(payload) : undefined;

            const response = await tauriFetch(url, {
                method,
                timeout,
                headers,
                body: requestBody
            });

            return {
                ok: response.ok,
                status: response.status,
                data: response.data,
                json: async () => response.data
            };
        } catch (e: any) {
            console.error('[UniversalFetch] Tauri fetch failed:', e);
            throw e;
        }
    } else {
        // Standard browser fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json().catch(() => null);

            return {
                ok: response.ok,
                status: response.status,
                data,
                json: async () => data
            };
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    }
}
