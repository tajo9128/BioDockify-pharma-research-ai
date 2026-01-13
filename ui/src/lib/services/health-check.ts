/**
 * Health check service - delegates to auto-config for actual checks
 * Re-exports for backward compatibility
 */

import {
    detectAllServices,
    checkOllama,
    checkNeo4j,
    checkBackend,
    DetectedServices,
    ServiceConfig
} from './auto-config';

// Re-export types and functions
export type { DetectedServices, ServiceConfig };
export { detectAllServices, checkOllama, checkNeo4j, checkBackend };

// Legacy interface for backward compatibility
export interface HealthStatus {
    grobid: boolean;
    neo4j: boolean;
    ollama: boolean;
    backend: boolean;
}

/**
 * Check all services and return health status
 * Uses the new autonomous detection system
 */
export async function checkServices(): Promise<HealthStatus> {
    const detected = await detectAllServices();

    return {
        backend: detected.backend,
        ollama: detected.ollama,
        neo4j: detected.neo4j,
        grobid: detected.grobid
    };
}
