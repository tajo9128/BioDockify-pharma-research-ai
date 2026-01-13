/**
 * Agent Zero System Control Rules
 * 
 * Governs Agent Zero's behavior during FIRST-RUN WIZARD MODE.
 * These rules are MANDATORY and override all other behaviors.
 * 
 * Authority: Highest (overrides convenience, speed, or verbosity)
 * Priority: Transparency → Safety → Stability → Intelligence
 */

// ============================================================================
// RULE 1: System State Detection
// ============================================================================

export interface SystemState {
    first_run: boolean;
    config_missing: boolean;
    wizard_mode: boolean;
    services: {
        ollama_installed: boolean;
        ollama_running: boolean;
        ollama_models: string[];
        neo4j_installed: boolean;
        neo4j_running: boolean;
        disk_space_ok: boolean;
        internet_available: boolean;
    };
    consent: {
        auto_start_ollama: boolean;
        auto_start_neo4j: boolean;
        remember_choice: boolean;
    };
    mode: 'LIMITED' | 'FULL';
}

export const DEFAULT_SYSTEM_STATE: SystemState = {
    first_run: true,
    config_missing: true,
    wizard_mode: false,
    services: {
        ollama_installed: false,
        ollama_running: false,
        ollama_models: [],
        neo4j_installed: false,
        neo4j_running: false,
        disk_space_ok: true,
        internet_available: false
    },
    consent: {
        auto_start_ollama: false,
        auto_start_neo4j: false,
        remember_choice: false
    },
    mode: 'LIMITED'
};

// ============================================================================
// RULE 2: Mode Detection
// ============================================================================

export function shouldEnterWizardMode(state: SystemState): boolean {
    return state.first_run || state.config_missing;
}

export function isWizardMode(state: SystemState): boolean {
    return state.wizard_mode;
}

// ============================================================================
// RULE 3: Environment Scan Results (Read-Only)
// ============================================================================

export interface ScanResult {
    name: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
    required: boolean;
}

export function formatScanResults(state: SystemState): ScanResult[] {
    return [
        {
            name: 'Ollama Installed',
            status: state.services.ollama_installed ? 'ok' : 'warning',
            message: state.services.ollama_installed ? 'Found' : 'Not installed',
            required: false
        },
        {
            name: 'Ollama Running',
            status: state.services.ollama_running ? 'ok' : 'warning',
            message: state.services.ollama_running
                ? `Running (${state.services.ollama_models.length} models)`
                : 'Not running',
            required: false
        },
        {
            name: 'Neo4j Installed',
            status: state.services.neo4j_installed ? 'ok' : 'warning',
            message: state.services.neo4j_installed ? 'Found' : 'Not installed',
            required: false
        },
        {
            name: 'Neo4j Running',
            status: state.services.neo4j_running ? 'ok' : 'warning',
            message: state.services.neo4j_running ? 'Running' : 'Not running',
            required: false
        },
        {
            name: 'Disk Space',
            status: state.services.disk_space_ok ? 'ok' : 'error',
            message: state.services.disk_space_ok ? 'Sufficient' : 'Low disk space',
            required: true
        }
    ];
}

// ============================================================================
// RULE 4: Consent Management
// ============================================================================

export interface ConsentRequest {
    id: keyof SystemState['consent'];
    label: string;
    description: string;
    granted: boolean;
}

export function getConsentRequests(state: SystemState): ConsentRequest[] {
    return [
        {
            id: 'auto_start_ollama',
            label: 'Allow BioDockify to start Ollama automatically',
            description: 'When launching, BioDockify can start the Ollama service for you.',
            granted: state.consent.auto_start_ollama
        },
        {
            id: 'auto_start_neo4j',
            label: 'Allow BioDockify to start Neo4j automatically',
            description: 'When launching, BioDockify can start the Neo4j database for you.',
            granted: state.consent.auto_start_neo4j
        },
        {
            id: 'remember_choice',
            label: 'Remember my choice',
            description: 'Save these preferences for future sessions.',
            granted: state.consent.remember_choice
        }
    ];
}

// ============================================================================
// RULE 5: Guided Setup (No Autonomy)
// ============================================================================

export interface SetupGuidance {
    component: string;
    needed: boolean;
    reason: string;
    downloadUrl: string;
    canSkip: boolean;
    skipConsequences: string[];
}

export function getSetupGuidance(): SetupGuidance[] {
    return [
        {
            component: 'Ollama',
            needed: true,
            reason: 'Required for local AI reasoning and research assistance.',
            downloadUrl: 'https://ollama.ai/download',
            canSkip: true,
            skipConsequences: [
                'AI reasoning will be disabled',
                'Research assistant features unavailable',
                'Document summarization disabled'
            ]
        },
        {
            component: 'Neo4j',
            needed: false,
            reason: 'Optional: Enables knowledge graph for advanced research connections.',
            downloadUrl: 'https://neo4j.com/download/',
            canSkip: true,
            skipConsequences: [
                'Knowledge graph features disabled',
                'Research relationship mapping unavailable'
            ]
        }
    ];
}

// ============================================================================
// RULE 6: Safe-Mode Declaration
// ============================================================================

export interface SystemModeDeclaration {
    mode: 'LIMITED' | 'FULL';
    title: string;
    capabilities: {
        feature: string;
        enabled: boolean;
    }[];
}

export function getSystemModeDeclaration(state: SystemState): SystemModeDeclaration {
    const isLimited = !state.services.ollama_running;

    return {
        mode: isLimited ? 'LIMITED' : 'FULL',
        title: isLimited ? 'Limited Mode Active' : 'Full Mode Active',
        capabilities: [
            { feature: 'AI reasoning', enabled: state.services.ollama_running },
            { feature: 'Memory persistence', enabled: state.services.neo4j_running },
            { feature: 'File reading', enabled: true },
            { feature: 'PDF processing', enabled: true },
            { feature: 'Literature search', enabled: true },
            { feature: 'Research assistant', enabled: state.services.ollama_running }
        ]
    };
}

// ============================================================================
// RULE 7: Configuration Commit (Atomic)
// ============================================================================

export interface ConfigCommitResult {
    success: boolean;
    error?: string;
}

export async function commitConfiguration(
    state: SystemState,
    saveConfig: (config: any) => Promise<boolean>
): Promise<ConfigCommitResult> {
    // Only commit after user confirmation
    const config = {
        first_run: false,
        consent: state.consent,
        services: {
            ollama_url: state.services.ollama_running ? 'http://localhost:11434' : '',
            ollama_enabled: state.consent.auto_start_ollama,
            neo4j_uri: state.services.neo4j_running ? 'bolt://localhost:7687' : '',
            neo4j_enabled: state.consent.auto_start_neo4j
        },
        mode: state.mode
    };

    try {
        const success = await saveConfig(config);
        if (!success) {
            return { success: false, error: 'Configuration save failed. Please try again.' };
        }
        return { success: true };
    } catch (e) {
        return {
            success: false,
            error: 'Unable to save configuration. Please check disk permissions.'
        };
    }
}

// ============================================================================
// RULE 8: Post-Wizard Verification
// ============================================================================

export interface VerificationResult {
    allPassed: boolean;
    checks: {
        name: string;
        passed: boolean;
        message: string;
    }[];
}

export async function verifyPostWizard(
    state: SystemState,
    checkOllama: () => Promise<boolean>,
    checkNeo4j: () => Promise<boolean>
): Promise<VerificationResult> {
    const checks: { name: string; passed: boolean; message: string }[] = [];

    // Only verify services that were enabled
    if (state.consent.auto_start_ollama || state.services.ollama_running) {
        const ollamaOk = await checkOllama();
        checks.push({
            name: 'Ollama Connection',
            passed: ollamaOk,
            message: ollamaOk ? 'Reachable' : 'Not reachable'
        });
    }

    if (state.consent.auto_start_neo4j || state.services.neo4j_running) {
        const neo4jOk = await checkNeo4j();
        checks.push({
            name: 'Neo4j Connection',
            passed: neo4jOk,
            message: neo4jOk ? 'Reachable' : 'Not reachable'
        });
    }

    return {
        allPassed: checks.every(c => c.passed),
        checks
    };
}

// ============================================================================
// RULE 9: Handover Message
// ============================================================================

export function getHandoverMessage(state: SystemState): string {
    const mode = getSystemModeDeclaration(state);

    if (mode.mode === 'FULL') {
        return 'BioDockify is now fully operational.';
    } else {
        const disabled = mode.capabilities
            .filter(c => !c.enabled)
            .map(c => c.feature)
            .join(', ');
        return `BioDockify is ready in Limited Mode. Some features are unavailable: ${disabled}`;
    }
}

// ============================================================================
// RULE 10: One-Time Execution Check
// ============================================================================

export function hasCompletedFirstRun(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('biodockify_first_run_complete') === 'true';
}

export function markFirstRunComplete(): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('biodockify_first_run_complete', 'true');
    }
}

export function resetFirstRun(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('biodockify_first_run_complete');
    }
}

// ============================================================================
// RULE 11: Error Transparency (Plain Language)
// ============================================================================

export function formatErrorMessage(error: Error | string): string {
    const messages: Record<string, string> = {
        'ECONNREFUSED': 'Unable to connect. The service may not be running.',
        'ETIMEDOUT': 'Connection timed out. Please check your network.',
        'ENOTFOUND': 'Service not found. Please verify the address.',
        'NetworkError': 'Network issue detected. Please check your connection.',
    };

    const errorStr = typeof error === 'string' ? error : error.message;

    for (const [key, msg] of Object.entries(messages)) {
        if (errorStr.includes(key)) {
            return msg;
        }
    }

    return 'An unexpected issue occurred. Please try again.';
}

// ============================================================================
// RULE 12: Prohibited Actions Enforcement
// ============================================================================

export interface WizardModeRestrictions {
    allowAIReasoning: boolean;
    allowMemoryWrites: boolean;
    allowResearchQuestions: boolean;
    allowExperimentSuggestions: boolean;
    allowInternetWithoutConsent: boolean;
    allowUserDataStorage: boolean;
}

export function getWizardModeRestrictions(): WizardModeRestrictions {
    return {
        allowAIReasoning: false,
        allowMemoryWrites: false,
        allowResearchQuestions: false,
        allowExperimentSuggestions: false,
        allowInternetWithoutConsent: false,
        allowUserDataStorage: false
    };
}

// ============================================================================
// FINAL ANTIGRAVITY OVERRIDE
// ============================================================================

export const PRIORITY_ORDER = ['Transparency', 'Safety', 'Stability', 'Intelligence'] as const;

export function resolveConflict(
    options: { option: string; category: typeof PRIORITY_ORDER[number] }[]
): string {
    const sorted = [...options].sort((a, b) => {
        return PRIORITY_ORDER.indexOf(a.category) - PRIORITY_ORDER.indexOf(b.category);
    });
    return sorted[0].option;
}
