/**
 * useAgentZero Hook
 * 
 * Initializes Agent Zero autonomous services on app mount.
 * Handles: First-run detection, service initialization, and lifecycle management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSystemController, SystemController } from '@/lib/system-controller';
import {
    initializeAgentZeroServices,
    getServiceLifecycleManager,
    ServiceStatus,
    LifecycleConfig
} from '@/lib/service-lifecycle';
import { SystemState, hasCompletedFirstRun } from '@/lib/system-rules';

interface AgentZeroState {
    initialized: boolean;
    loading: boolean;
    showFirstRun: boolean;
    systemMode: 'LIMITED' | 'FULL';
    services: ServiceStatus[];
    modelsAvailable: boolean;
    error?: string;
}

interface UseAgentZeroResult extends AgentZeroState {
    controller: SystemController;
    initialize: () => Promise<void>;
    refreshServices: () => Promise<void>;
    configureAutoStart: (config: Partial<LifecycleConfig>) => void;
}

export function useAgentZero(): UseAgentZeroResult {
    const [state, setState] = useState<AgentZeroState>({
        initialized: false,
        loading: true,
        showFirstRun: false,
        systemMode: 'LIMITED',
        services: [],
        modelsAvailable: false
    });

    const controller = getSystemController();
    const lifecycleManager = getServiceLifecycleManager();

    const initialize = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
            // Check if first run
            const isFirstRun = !hasCompletedFirstRun();

            if (isFirstRun) {
                // Set first run state
                controller.enterWizardMode();
                setState(prev => ({
                    ...prev,
                    loading: false,
                    showFirstRun: true,
                    initialized: false
                }));
                return;
            }

            // Initialize services
            const result = await initializeAgentZeroServices();

            // Determine system mode
            const ollamaRunning = result.services.find(s => s.name === 'Ollama')?.running ?? false;
            const systemMode = ollamaRunning ? 'FULL' : 'LIMITED';

            setState({
                initialized: true,
                loading: false,
                showFirstRun: false,
                systemMode,
                services: result.services,
                modelsAvailable: result.modelsAvailable
            });

            console.log('[useAgentZero] Initialized:', {
                mode: systemMode,
                services: result.services.map(s => `${s.name}: ${s.running ? '✓' : '✗'}`),
                autoStarted: result.autoStarted
            });

        } catch (e: any) {
            console.error('[useAgentZero] Initialization failed:', e);
            setState(prev => ({
                ...prev,
                loading: false,
                error: e.message
            }));
        }
    }, [controller]);

    const refreshServices = useCallback(async () => {
        await lifecycleManager.checkAllServices();
        setState(prev => ({
            ...prev,
            services: lifecycleManager.getAllStatuses()
        }));
    }, [lifecycleManager]);

    const configureAutoStart = useCallback((config: Partial<LifecycleConfig>) => {
        lifecycleManager.updateConfig(config);
    }, [lifecycleManager]);

    // Initialize on mount
    useEffect(() => {
        initialize();

        // Subscribe to service updates
        const unsubscribe = lifecycleManager.subscribe((serviceMap) => {
            setState(prev => ({
                ...prev,
                services: Array.from(serviceMap.values())
            }));
        });

        return () => {
            unsubscribe();
            lifecycleManager.stopHealthMonitoring();
        };
    }, [initialize, lifecycleManager]);

    return {
        ...state,
        controller,
        initialize,
        refreshServices,
        configureAutoStart
    };
}

export default useAgentZero;
