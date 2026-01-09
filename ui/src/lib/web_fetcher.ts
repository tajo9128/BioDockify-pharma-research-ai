import { fetch } from '@tauri-apps/api/http';
import { cleanHtml, CleanedWebPage } from './html_cleaner';

/**
 * Fetches and cleans a public web page using Tauri's native HTTP client.
 * Bypasses CORS issues present in standard browser fetch.
 */
export async function fetchWebPage(url: string): Promise<CleanedWebPage> {
    console.log(`[WebFetcher] Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const html = response.data as string;
        return cleanHtml(html, url);

    } catch (e: any) {
        console.error(`[WebFetcher] Error fetching ${url}:`, e);
        throw new Error(`Failed to fetch webpage: ${e.message || 'Unknown error'}`);
    }
}

/**
 * Performs a lightweight search by scraping a privacy-friendly search engine (DuckDuckGo HTML).
 * This is a "No-API" fallback for finding URLs.
 */
export async function searchWeb(query: string): Promise<string[]> {
    console.log(`[WebFetcher] Searching: ${query}`);
    // Using DuckDuckGo HTML version which is easier to parse and intended for low-bandwidth
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(searchUrl, {
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) return [];

        const html = response.data as string;

        // Simple regex extraction for result links
        // DDG HTML links usually look like: <a class="result__a" href="...">
        const linkRegex = /class="result__a" href="([^"]+)"/g;
        const matches = [...html.matchAll(linkRegex)];

        // Extract URLs and decode them
        const urls = matches.map(m => {
            let url = m[1];
            // DDG sometimes wraps URLs like /l/?kh=-1&uddg=...
            if (url.startsWith('//duckduckgo.com/l/')) {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                return urlParams.get('uddg') || '';
            }
            return url;
        }).filter(u => u && u.startsWith('http') && !u.includes('duckduckgo.com'));

        return [...new Set(urls)].slice(0, 3); // Return top 3 unique URLs

    } catch (e) {
        console.error('[WebFetcher] Search failed:', e);
        return [];
    }
}
