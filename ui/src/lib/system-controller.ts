/**
 * System Controller
 * 
 * Orchestrates the Agent Zero rules during First-Run Wizard.
 * This is the main entry point for system control behavior.
 */

import {
    SystemState,
    DEFAULT_SYSTEM_STATE,
    shouldEnterWizardMode,
    formatScanResults,
    getConsentRequests,
    getSystemModeDeclaration,
    getSetupGuidance,
    commitConfiguration,
    verifyPostWizard,
    getHandoverMessage,
    hasCompletedFirstRun,
    markFirstRunComplete,
    getWizardModeRestrictions,
    ScanResult,
    ConsentRequest,
    SystemModeDeclaration,
    SetupGuidance,
    VerificationResult
} from './system-rules';
import { detectAllServices } from './services/auto-config';

// ============================================================================
// System Controller Class
// ============================================================================

export class SystemController {
    private state: SystemState;
    private listeners: Set<(state: SystemState) => void> = new Set();

    constructor() {
        this.state = { ...DEFAULT_SYSTEM_STATE };
    }

    // -------------------------------------------------------------------------
    // State Management
    // -------------------------------------------------------------------------

    getState(): SystemState {
        return { ...this.state };
    }

    private setState(updates: Partial<SystemState>): void {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    subscribe(listener: (state: SystemState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.getState()));
    }

    // -------------------------------------------------------------------------
    // RULE 1: First-Run Detection
    // -------------------------------------------------------------------------

    async checkFirstRun(): Promise<boolean> {
        const completed = hasCompletedFirstRun();

        this.setState({
            first_run: !completed,
            config_missing: !completed
        });

        return shouldEnterWizardMode(this.state);
    }

    enterWizardMode(): void {
        this.setState({ wizard_mode: true });
        console.log('[SystemController] Entered FIRST_RUN_WIZARD_MODE');
    }

    exitWizardMode(): void {
        this.setState({ wizard_mode: false });
        console.log('[SystemController] Exited FIRST_RUN_WIZARD_MODE');
    }

    // -------------------------------------------------------------------------
    // RULE 3: Environment Scan (Read-Only)
    // -------------------------------------------------------------------------

    async performEnvironmentScan(): Promise<ScanResult[]> {
        console.log('[SystemController] Performing environment scan...');

        try {
            const detected = await detectAllServices();

            this.setState({
                services: {
                    lm_studio_installed: detected.lm_studio,
                    lm_studio_running: detected.lm_studio,
                    lm_studio_models: [], // LM Studio models are dynamic
                    disk_space_ok: true,
                    internet_available: detected.backend
                }
            });

            console.log('[SystemController] Scan complete:', this.state.services);
        } catch (e) {
            console.error('[SystemController] Scan failed:', e);
        }

        return formatScanResults(this.state);
    }

    getScanResults(): ScanResult[] {
        return formatScanResults(this.state);
    }

    // -------------------------------------------------------------------------
    // RULE 4: Consent Management
    // -------------------------------------------------------------------------

    getConsentRequests(): ConsentRequest[] {
        return getConsentRequests(this.state);
    }

    setConsent(id: keyof SystemState['consent'], granted: boolean): void {
        this.setState({
            consent: {
                ...this.state.consent,
                [id]: granted
            }
        });
        console.log(`[SystemController] Consent ${id} = ${granted}`);
    }

    // -------------------------------------------------------------------------
    // RULE 5: Guided Setup
    // -------------------------------------------------------------------------

    getSetupGuidance(): SetupGuidance[] {
        const guidance = getSetupGuidance();

        // Filter by what's actually needed
        return guidance.filter(g => {
            if (g.component === 'LM Studio') {
                return !this.state.services.lm_studio_running;
            }

            return true;
        });
    }

    // -------------------------------------------------------------------------
    // RULE 6: Safe-Mode Declaration
    // -------------------------------------------------------------------------

    getSystemMode(): SystemModeDeclaration {
        return getSystemModeDeclaration(this.state);
    }

    // -------------------------------------------------------------------------
    // RULE 7: Configuration Commit
    // -------------------------------------------------------------------------

    async commitConfiguration(): Promise<{ success: boolean; error?: string }> {
        const result = await commitConfiguration(
            this.state,
            async (config) => {
                try {
                    // Save to localStorage
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('biodockify_config', JSON.stringify(config));
                    }

                    // Also try to save to backend
                    try {
                        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8234';
                        await fetch(`${API_BASE}/api/settings`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(config)
                        });
                    } catch {
                        // Backend save is optional
                        console.log('[SystemController] Backend save skipped');
                    }

                    return true;
                } catch {
                    return false;
                }
            }
        );

        if (result.success) {
            markFirstRunComplete();
            this.setState({
                first_run: false,
                config_missing: false,
                mode: this.state.services.lm_studio_running ? 'FULL' : 'LIMITED'
            });
        }

        return result;
    }

    // -------------------------------------------------------------------------
    // RULE 8: Post-Wizard Verification
    // -------------------------------------------------------------------------

    async verifyConfiguration(): Promise<VerificationResult> {
        return verifyPostWizard(
            this.state,
            async () => {
                // Check LM Studio
                const detected = await detectAllServices();
                return detected.lm_studio;
            }

        );
    }

    // -------------------------------------------------------------------------
    // RULE 9: Handover
    // -------------------------------------------------------------------------

    getHandoverMessage(): string {
        return getHandoverMessage(this.state);
    }

    completeSetup(): void {
        this.exitWizardMode();
        console.log('[SystemController] Setup complete:', this.getHandoverMessage());
    }

    // -------------------------------------------------------------------------
    // RULE 12: Restrictions Check
    // -------------------------------------------------------------------------

    isActionAllowed(action: keyof ReturnType<typeof getWizardModeRestrictions>): boolean {
        if (!this.state.wizard_mode) {
            return true; // All actions allowed outside wizard mode
        }

        const restrictions = getWizardModeRestrictions();
        return restrictions[action];
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let controllerInstance: SystemController | null = null;

export function getSystemController(): SystemController {
    if (!controllerInstance) {
        controllerInstance = new SystemController();
    }
    return controllerInstance;
}

export function resetSystemController(): void {
    controllerInstance = null;
}
