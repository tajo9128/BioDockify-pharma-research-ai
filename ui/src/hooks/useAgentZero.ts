/**
 * useAgentZero Hook
 * 
 * Initializes Agent Zero with automatic self-configuration.
 * Once any AI provider is available, Agent Zero configures itself automatically.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSystemController, SystemController } from '@/lib/system-controller';
import {
    getServiceLifecycleManager,
    ServiceStatus,
    LifecycleConfig
} from '@/lib/service-lifecycle';
import {
    initializeAgentZeroWithAI,
    detectAIProviders,
    selfConfigure,
    isConfigured,
    AIProvider
} from '@/lib/self-config';
import { hasCompletedFirstRun } from '@/lib/system-rules';

interface AgentZeroState {
    initialized: boolean;
    loading: boolean;
    showFirstRun: boolean;
    systemMode: 'LIMITED' | 'FULL';
    services: ServiceStatus[];
    modelsAvailable: boolean;
    aiProvider: AIProvider | null;
    selfConfigured: boolean;
    error?: string;
}

interface UseAgentZeroResult extends AgentZeroState {
    controller: SystemController;
    initialize: () => Promise<void>;
    refreshServices: () => Promise<void>;
    configureAutoStart: (config: Partial<LifecycleConfig>) => void;
    reconfigure: () => Promise<void>;
}

export function useAgentZero(): UseAgentZeroResult {
    const [state, setState] = useState<AgentZeroState>({
        initialized: false,
        loading: true,
        showFirstRun: false,
        systemMode: 'LIMITED',
        services: [],
        modelsAvailable: false,
        aiProvider: null,
        selfConfigured: false
    });

    const controller = getSystemController();
    const lifecycleManager = getServiceLifecycleManager();

    const initialize = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
            console.log('[useAgentZero] Initializing...');

            // Check if already configured
            const alreadyConfigured = isConfigured();

            if (!alreadyConfigured) {
                // First run - attempt self-configuration
                console.log('[useAgentZero] First run - attempting self-configuration...');

                // Try to self-configure with available AI
                const result = await initializeAgentZeroWithAI();

                if (result.ready && result.provider) {
                    // Successfully self-configured!
                    console.log('[useAgentZero] Self-configured with:', result.provider.name);

                    setState({
                        initialized: true,
                        loading: false,
                        showFirstRun: false,
                        systemMode: result.mode,
                        services: lifecycleManager.getAllStatuses(),
                        modelsAvailable: result.provider.models ? result.provider.models.length > 0 : false,
                        aiProvider: result.provider,
                        selfConfigured: true
                    });

                    // Start health monitoring
                    lifecycleManager.startHealthMonitoring();
                    return;
                }

                // No AI available - show first run wizard
                controller.enterWizardMode();
                setState(prev => ({
                    ...prev,
                    loading: false,
                    showFirstRun: true,
                    initialized: false,
                    selfConfigured: false
                }));
                return;
            }

            // Already configured - just initialize services
            const providers = await detectAIProviders();
            const bestProvider = providers.length > 0 ? providers[0] : null;

            // Check services
            await lifecycleManager.checkAllServices();
            const services = lifecycleManager.getAllStatuses();

            const ollamaRunning = services.find(s => s.name === 'Ollama')?.running ?? false;
            const systemMode = (ollamaRunning || bestProvider) ? 'FULL' : 'LIMITED';

            setState({
                initialized: true,
                loading: false,
                showFirstRun: false,
                systemMode,
                services,
                modelsAvailable: bestProvider?.models ? bestProvider.models.length > 0 : false,
                aiProvider: bestProvider,
                selfConfigured: true
            });

            // Start health monitoring
            lifecycleManager.startHealthMonitoring();

            console.log('[useAgentZero] Initialized:', {
                mode: systemMode,
                provider: bestProvider?.name,
                services: services.map(s => `${s.name}: ${s.running ? '✓' : '✗'}`)
            });

        } catch (e: any) {
            console.error('[useAgentZero] Initialization failed:', e);
            setState(prev => ({
                ...prev,
                loading: false,
                error: e.message
            }));
        }
    }, [controller, lifecycleManager]);

    const refreshServices = useCallback(async () => {
        await lifecycleManager.checkAllServices();
        const providers = await detectAIProviders();

        setState(prev => ({
            ...prev,
            services: lifecycleManager.getAllStatuses(),
            aiProvider: providers.length > 0 ? providers[0] : null
        }));
    }, [lifecycleManager]);

    const configureAutoStart = useCallback((config: Partial<LifecycleConfig>) => {
        lifecycleManager.updateConfig(config);
    }, [lifecycleManager]);

    const reconfigure = useCallback(async () => {
        console.log('[useAgentZero] Reconfiguring...');
        const result = await selfConfigure();

        if (result.success && result.provider) {
            setState(prev => ({
                ...prev,
                aiProvider: result.provider,
                systemMode: 'FULL',
                selfConfigured: true
            }));
        }
    }, []);

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
        configureAutoStart,
        reconfigure
    };
}

export default useAgentZero;
