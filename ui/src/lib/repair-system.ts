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
     * Takes a diagnosis and proposes REAL repair actions using backend APIs.
     */
    public createRepairPlan(diagnosis: DiagnosticReport): RepairPlan {
        const actions: RepairAction[] = [];
        const manager = getServiceLifecycleManager();
        let riskLevel: 'low' | 'medium' | 'high' = 'low';

        // 1. Backend API Repair - CRITICAL, must be first
        const backendCheck = diagnosis.checks.find(c => c.id === 'backend_api');
        if (backendCheck && backendCheck.status === 'error') {
            actions.push({
                id: 'start_backend',
                description: 'Start Backend API Server',
                risk: 'medium',
                action: async () => {
                    console.log('[Repair] Attempting to start backend server...');

                    // Try Tauri shell first (desktop app)
                    if (typeof window !== 'undefined' && '__TAURI__' in window) {
                        try {
                            const { Command } = await import('@tauri-apps/api/shell');
                            console.log('[Repair] Using Tauri to start backend...');

                            // Start the backend server
                            const cmd = new Command('cmd', ['/c', 'start', '/b', '.venv\\Scripts\\python.exe', 'server.py']);
                            await cmd.execute();

                            // Wait for startup
                            await new Promise(r => setTimeout(r, 12000));

                            // Verify
                            const healthRes = await fetch('http://localhost:8234/health', {
                                signal: AbortSignal.timeout(5000)
                            });

                            if (healthRes.ok) {
                                console.log('[Repair] Backend started successfully via Tauri');
                                return true;
                            }
                        } catch (e) {
                            console.error('[Repair] Tauri start failed:', e);
                        }
                    }

                    // Fallback: check if it came online
                    await new Promise(r => setTimeout(r, 3000));
                    const status = await manager.checkService('backend');
                    return status.running;
                }
            });
            riskLevel = 'medium';
        }

        // 2. LM Studio Repair - Use backend auto-start API
        const lmStudioCheck = diagnosis.checks.find(c => c.id === 'lm_studio');
        if (lmStudioCheck && (lmStudioCheck.status === 'error' || lmStudioCheck.status === 'warning')) {
            actions.push({
                id: 'start_lm_studio',
                description: 'Start LM Studio (Local AI)',
                risk: 'low',
                action: async () => {
                    console.log('[Repair] Attempting to start LM Studio...');

                    try {
                        // Use the backend API to start LM Studio
                        const res = await fetch('http://localhost:8234/api/diagnose/lm-studio/start', {
                            method: 'POST',
                            signal: AbortSignal.timeout(30000) // LM Studio takes time to start
                        });

                        if (res.ok) {
                            const data = await res.json();
                            console.log('[Repair] LM Studio start result:', data);

                            if (data.success) {
                                // Wait for LM Studio to fully initialize
                                await new Promise(r => setTimeout(r, 5000));

                                // Verify it's responding
                                const verifyRes = await fetch('http://localhost:1234/v1/models', {
                                    signal: AbortSignal.timeout(5000)
                                });
                                return verifyRes.ok;
                            }
                        }
                    } catch (e) {
                        console.error('[Repair] LM Studio start failed:', e);
                    }

                    return false;
                }
            });
        }

        // 3. Ollama Repair - Use backend API
        const ollamaCheck = diagnosis.checks.find(c => c.id === 'ollama_service');
        if (ollamaCheck && ollamaCheck.status !== 'ok') {
            actions.push({
                id: 'restart_ollama',
                description: 'Start Ollama Service',
                risk: 'low',
                action: async () => {
                    console.log('[Repair] Attempting to repair Ollama...');

                    try {
                        // Use the backend repair API
                        const res = await fetch('http://localhost:8234/api/v2/system/repair?service=ollama', {
                            method: 'POST',
                            signal: AbortSignal.timeout(30000)
                        });

                        if (res.ok) {
                            const data = await res.json();
                            console.log('[Repair] Ollama repair result:', data);
                            return data.status === 'success';
                        }
                    } catch (e) {
                        console.log('[Repair] Backend API unavailable, trying local...');
                    }

                    // Fallback to lifecycle manager
                    const result = await manager.autoStartServices();
                    const status = await manager.checkService('ollama');
                    return status.running;
                }
            });
        }

        // 4. AI Model Pull (if no models available)
        const modelCheck = diagnosis.checks.find(c => c.id === 'local_models');
        if (modelCheck && modelCheck.status !== 'ok') {
            actions.push({
                id: 'pull_model',
                description: 'Download AI Model (llama3.2:3b)',
                risk: 'low',
                action: async () => {
                    console.log('[Repair] Downloading required model...');
                    return await manager.ensureDefaultModel();
                }
            });
        }

        // 5. Full Connectivity Diagnosis & Auto-Repair
        if (actions.length > 0) {
            actions.push({
                id: 'full_connectivity_repair',
                description: 'Run Full Connectivity Repair',
                risk: 'low',
                action: async () => {
                    console.log('[Repair] Running full connectivity diagnosis with auto-repair...');

                    try {
                        const res = await fetch('http://localhost:8234/api/diagnose/connectivity', {
                            method: 'GET',
                            signal: AbortSignal.timeout(30000)
                        });

                        if (res.ok) {
                            const data = await res.json();
                            console.log('[Repair] Connectivity diagnosis:', data);

                            // The backend auto-repairs when auto_repair=True
                            return data.status === 'healthy' || data.can_proceed;
                        }
                    } catch (e) {
                        console.error('[Repair] Connectivity repair failed:', e);
                    }

                    return false;
                }
            });
        }

        // 6. Settings Reset (if critical issues)
        if (diagnosis.checks.filter(c => c.status === 'error').length >= 3) {
            actions.push({
                id: 'reset_settings',
                description: 'Reset to Default Settings',
                risk: 'high',
                action: async () => {
                    console.log('[Repair] Resetting settings to defaults...');

                    try {
                        const res = await fetch('http://localhost:8234/api/settings/reset', {
                            method: 'POST',
                            signal: AbortSignal.timeout(10000)
                        });

                        if (res.ok) {
                            const data = await res.json();
                            console.log('[Repair] Settings reset result:', data);
                            return data.status === 'success';
                        }
                    } catch (e) {
                        console.error('[Repair] Settings reset failed:', e);
                    }

                    return false;
                }
            });
            riskLevel = 'high';
        }

        // Determine overall explanation
        let explanation = 'No repairs needed.';
        if (actions.length > 0) {
            const issues = diagnosis.checks.filter(c => c.status === 'error').map(c => c.name);
            explanation = `Found ${issues.length} issue(s): ${issues.join(', ')}. ` +
                `Will attempt ${actions.length} repair action(s) using system APIs.`;
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
