/**
 * Agent Zero Repair System
 * 
 * Orchestrates the Safe Repair Workflow:
 * 1. Diagnosis
 * 2. Repair Plan Generation
 * 3. User Consent (REQUIRED)
 * 4. Safe Mode Execution
 * 5. Verification
 * 
 * CORE RULE: "Agent Zero may repair itself ONLY when explicitly instructed by the user"
 */

import { DiagnosticEngine, DiagnosticReport } from './diagnostics';
import { getServiceLifecycleManager } from './service-lifecycle';

// ============================================================================
// Types
// ============================================================================

export interface RepairAction {
    id: string;
    description: string;
    risk: 'low' | 'medium' | 'high';
    action: () => Promise<boolean>;
}

export interface RepairPlan {
    id: string;
    timestamp: Date;
    diagnosis: DiagnosticReport;
    actions: RepairAction[];
    estimatedRisk: 'low' | 'medium' | 'high';
    explanation: string;
}

export interface RepairResult {
    success: boolean;
    actionsTaken: { description: string; success: boolean }[];
    verificationResult: DiagnosticReport;
}

// ============================================================================
// Repair Manager
// ============================================================================

export class RepairManager {
    private static instance: RepairManager;
    private diagnosticEngine: DiagnosticEngine;

    private constructor() {
        this.diagnosticEngine = DiagnosticEngine.getInstance();
    }

    public static getInstance(): RepairManager {
        if (!RepairManager.instance) {
            RepairManager.instance = new RepairManager();
        }
        return RepairManager.instance;
    }

    /**
     * STEP 3: Generate Repair Plan
     * Takes a diagnosis and proposes safe repair actions.
     */
    public createRepairPlan(diagnosis: DiagnosticReport): RepairPlan {
        const actions: RepairAction[] = [];
        const manager = getServiceLifecycleManager();
        let riskLevel: 'low' | 'medium' | 'high' = 'low';

        // 1. Ollama Repair
        const ollamaCheck = diagnosis.checks.find(c => c.id === 'ollama_service');
        if (ollamaCheck && ollamaCheck.status !== 'ok') {
            actions.push({
                id: 'restart_ollama',
                description: 'Start/Restart Ollama Service',
                risk: 'low',
                action: async () => {
                    const res = await manager.autoStartServices(); // Reuse auto-start logic
                    // If it failed to start, try to return false (requires checking result)
                    // Simplified: check status after attempt
                    const status = await manager.checkService('ollama');
                    return status.running;
                }
            });
        }

        // 2. Model Repair
        const modelCheck = diagnosis.checks.find(c => c.id === 'local_models');
        if (modelCheck && modelCheck.status !== 'ok') {
            actions.push({
                id: 'pull_default_model',
                description: 'Download Repair Model (llama3.2:3b)',
                risk: 'low', // Bandwidth usage
                action: async () => {
                    return await manager.ensureDefaultModel();
                }
            });
        }

        // 3. Neo4j Repair
        const neo4jCheck = diagnosis.checks.find(c => c.id === 'neo4j_service');
        if (neo4jCheck && neo4jCheck.status === 'error') { // Only fix if strictly error, not just warning (optional)
            // User prompt explicitly asked for Neo4j recovery, so we include it.
            actions.push({
                id: 'restart_neo4j',
                description: 'Start/Restart Neo4j Database',
                risk: 'low',
                action: async () => {
                    const { started } = await manager.autoStartServices();
                    if (started.includes('Neo4j')) return true;

                    // Double check status
                    const status = await manager.checkService('neo4j');
                    return status.running;
                }
            });
        }

        // 4. Backend/API Repair
        // We can't easily "fix" the backend if it's the parent process, 
        // but if it's a separate service we could try triggering a reconnect.
        // For now, no specific action for backend other than suggestion.

        // Determine overall explanation
        let explanation = 'No repairs needed.';
        if (actions.length > 0) {
            explanation = `Proposed fixes for ${actions.length} issue(s). Will attempt to restart services and ensure AI models are available.`;
        }

        return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            diagnosis,
            actions,
            estimatedRisk: riskLevel,
            explanation
        };
    }

    /**
     * STEP 4: Controlled Repair Execution
     * Executes the actions in the plan sequentially.
     * MUST be triggered by explicit user approval.
     */
    public async executeRepairPlan(plan: RepairPlan): Promise<RepairResult> {
        console.log('[RepairManager] Executing approved repair plan:', plan.id);

        const results: { description: string; success: boolean }[] = [];

        // Execute sequential repairs
        for (const action of plan.actions) {
            try {
                console.log(`[RepairManager] Action: ${action.description}`);
                const success = await action.action();
                results.push({ description: action.description, success });

                // Wait briefly between actions
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.error(`[RepairManager] Action failed: ${action.id}`, e);
                results.push({ description: action.description, success: false });
            }
        }

        // STEP 5: Verification
        console.log('[RepairManager] Verifying repairs...');
        const finalDiagnosis = await this.diagnosticEngine.runDiagnosis();

        const success = !finalDiagnosis.issuesFound;

        return {
            success,
            actionsTaken: results,
            verificationResult: finalDiagnosis
        };
    }
}
