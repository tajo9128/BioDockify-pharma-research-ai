/**
 * Health check service - routes through backend to avoid CORS issues
 */

// Backend API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8234';

export interface HealthStatus {
    grobid: boolean;
    neo4j: boolean;
    ollama: boolean;
    backend: boolean;
}

export async function checkServices(): Promise<HealthStatus> {
    const health: HealthStatus = {
        grobid: false,
        neo4j: false,
        ollama: false,
        backend: false
    };

    // Check if backend is reachable first
    try {
        const backendRes = await fetch(`${API_BASE}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        health.backend = backendRes.ok;
    } catch (e) {
        console.error('Backend not available');
        return health; // If backend is down, other checks will fail anyway
    }

    // Check Ollama through backend proxy
    try {
        const ollamaRes = await fetch(`${API_BASE}/api/settings/ollama/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base_url: 'http://localhost:11434' })
        });
        if (ollamaRes.ok) {
            const data = await ollamaRes.json();
            health.ollama = data.status === 'success';
        }
    } catch (e) {
        console.error('Ollama health check failed');
    }

    // Check Neo4j through backend proxy
    try {
        const neo4jRes = await fetch(`${API_BASE}/api/settings/neo4j/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uri: 'bolt://localhost:7687',
                user: 'neo4j',
                password: ''
            })
        });
        if (neo4jRes.ok) {
            const data = await neo4jRes.json();
            health.neo4j = data.status === 'success';
        }
    } catch (e) {
        console.error('Neo4j health check failed');
    }

    // Check GROBID through backend proxy (if endpoint exists)
    // For now, mark as available if backend is up
    health.grobid = health.backend;

    return health;
}
