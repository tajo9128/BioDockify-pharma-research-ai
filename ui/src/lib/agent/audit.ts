import { THINKING_CONSTITUTION_TEXT } from './full_constitution_text';
import { memoryManager } from '@/lib/memory/MemoryManager';
import { DEFAULT_CONSTITUTION } from './default_constitution';

export interface AuditResult {
    ready: boolean;
    checks: {
        constitution: boolean;
        memory_system: boolean;
        persona_active: boolean;
        guardian_active: boolean;
        drift_status: 'stable' | 'drift_detected';
    };
    report: string;
}

export async function runSystemAudit(activePersonaId: string): Promise<AuditResult> {

    // 1. Check Constitution
    const constitutionLoaded = THINKING_CONSTITUTION_TEXT.length > 100;

    // 2. Check Memory System
    // Verify we can access the memory cache or manager
    const memoryReady = !!memoryManager;

    // 3. Check Guardian
    const guardianFound = DEFAULT_CONSTITUTION.core_modules.some(m => m.id === 'system_guardian');

    // 4. Drift Sentinel
    // Logic: Look for signs of "Runaway Confidence" or Memory Corruption.
    // For now, we check if we can read the active project. If undefined/error, that's a drift/instability sign.
    let driftStatus: 'stable' | 'drift_detected' = 'stable';
    try {
        const mem = memoryManager.getActiveMemory();
        if (mem && mem.decisions.length > 50) {
            // Heuristic: If we have >50 decisions but very few "Low Confidence" findings, we might be drifting.
            // This is a placeholder for the advanced logic.
            driftStatus = 'stable';
        }
    } catch (e) {
        driftStatus = 'drift_detected';
    }

    const allPass = constitutionLoaded && memoryReady && activePersonaId && guardianFound && driftStatus === 'stable';

    const report = `
Agent Zero Readiness Report
---------------------------
• Constitutions Loaded: ${constitutionLoaded ? '✓' : '✗'}
• Memory System:        ${memoryReady ? '✓' : '✗'} [${driftStatus === 'stable' ? 'Stable' : 'Drift Detected'}]
• Persona Active:       ${activePersonaId ? '✓' : '✗'}
• Guardian Module:      ${guardianFound ? '✓' : '✗'}
---------------------------
System Status: ${allPass ? 'OPERATIONAL' : 'DEGRADED'}
    `.trim();

    return {
        ready: allPass,
        checks: {
            constitution: constitutionLoaded,
            memory_system: memoryReady,
            persona_active: !!activePersonaId,
            guardian_active: guardianFound,
            drift_status: driftStatus
        },
        report
    };
}
