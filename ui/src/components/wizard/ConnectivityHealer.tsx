/**
 * ConnectivityHealer Component
 * 
 * Smart connectivity repair UI for the First-Run Wizard.
 * Automatically detects and attempts to resolve connection issues:
 * - Internet connectivity
 * - LM Studio (with auto-start)
 * - API key validation
 * - Backend health
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Wifi, WifiOff, Brain, Key, Server,
    RefreshCcw, Check, XCircle, AlertTriangle,
    Loader2, Play, ExternalLink
} from 'lucide-react';

interface ConnectionCheck {
    name: string;
    status: 'pending' | 'checking' | 'success' | 'warning' | 'error';
    message: string;
    details?: Record<string, any>;
    can_auto_repair?: boolean;
    repair_action?: string;
}

interface DiagnosisResult {
    status: 'healthy' | 'degraded' | 'offline';
    checks: ConnectionCheck[];
    repair_actions: string[];
    can_proceed: boolean;
}

interface ConnectivityHealerProps {
    onComplete: (result: DiagnosisResult) => void;
    onSkip: () => void;
}

export default function ConnectivityHealer({ onComplete, onSkip }: ConnectivityHealerProps) {
    const [checks, setChecks] = useState<ConnectionCheck[]>([
        { name: 'Internet Connectivity', status: 'pending', message: 'Waiting...' },
        { name: 'LM Studio', status: 'pending', message: 'Waiting...' },
        { name: 'API Keys', status: 'pending', message: 'Waiting...' },
        { name: 'Backend API', status: 'pending', message: 'Waiting...' },
    ]);
    const [overallStatus, setOverallStatus] = useState<'healthy' | 'degraded' | 'offline' | null>(null);
    const [canProceed, setCanProceed] = useState(false);
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairLog, setRepairLog] = useState<string[]>([]);
    const [isStartingLmStudio, setIsStartingLmStudio] = useState(false);

    // Run diagnosis on mount
    useEffect(() => {
        runDiagnosis();
    }, []);

    const addLog = (message: string) => {
        setRepairLog(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const runDiagnosis = async () => {
        addLog('Starting connectivity diagnosis...');

        // Set all to checking
        setChecks(prev => prev.map(c => ({ ...c, status: 'checking' as const, message: 'Checking...' })));

        try {
            // Try backend first
            const response = await fetch('/api/diagnose/connectivity', {
                method: 'GET',
                signal: AbortSignal.timeout(60000) // 60s timeout for full diagnosis
            });

            if (response.ok) {
                const result: DiagnosisResult = await response.json();

                // Map backend result to our state
                const mappedChecks = result.checks.map(c => ({
                    ...c,
                    status: c.status as ConnectionCheck['status']
                }));

                setChecks(mappedChecks);
                setOverallStatus(result.status);
                setCanProceed(result.can_proceed);

                addLog(`Diagnosis complete: ${result.status.toUpperCase()}`);

                // If all passed, auto-proceed after delay
                if (result.status === 'healthy') {
                    setTimeout(() => onComplete(result), 1500);
                }
            } else {
                // Backend not available - run client-side checks
                addLog('Backend unavailable, running client-side checks...');
                await runClientSideChecks();
            }
        } catch (error) {
            console.error('Diagnosis failed:', error);
            addLog('Diagnosis failed, running client-side checks...');
            await runClientSideChecks();
        }
    };

    const runClientSideChecks = async () => {
        // Simplified client-side checks when backend is down
        const newChecks: ConnectionCheck[] = [];

        // 1. Internet check (simple fetch to known endpoints)
        try {
            addLog('Checking internet...');
            await fetch('https://www.google.com/favicon.ico', {
                mode: 'no-cors',
                signal: AbortSignal.timeout(5000)
            });
            newChecks.push({
                name: 'Internet Connectivity',
                status: 'success',
                message: 'Connected'
            });
        } catch {
            newChecks.push({
                name: 'Internet Connectivity',
                status: 'error',
                message: 'No internet connection',
                repair_action: 'Check your network connection'
            });
        }

        // 2. LM Studio check
        addLog('Checking LM Studio...');
        const lmPorts = [1234, 1235, 8080, 5000, 8000];
        let lmFound = false;
        let lmDetails: Record<string, any> = {};

        for (const port of lmPorts) {
            try {
                const res = await fetch(`http://localhost:${port}/v1/models`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data?.length > 0) {
                        lmFound = true;
                        lmDetails = {
                            port,
                            model: data.data[0]?.id,
                            url: `http://localhost:${port}/v1`
                        };
                        break;
                    }
                }
            } catch {
                // Continue to next port
            }
        }

        if (lmFound) {
            newChecks.push({
                name: 'LM Studio',
                status: 'success',
                message: `Connected on port ${lmDetails.port}`,
                details: lmDetails
            });
        } else {
            newChecks.push({
                name: 'LM Studio',
                status: 'warning',
                message: 'Not detected on any port',
                can_auto_repair: true,
                repair_action: 'Start LM Studio and load a model'
            });
        }

        // 3. API Keys - can't check without backend
        newChecks.push({
            name: 'API Keys',
            status: 'warning',
            message: 'Cannot validate (backend offline)'
        });

        // 4. Backend check
        try {
            const res = await fetch('http://localhost:8234/api/health', {
                signal: AbortSignal.timeout(3000)
            });
            newChecks.push({
                name: 'Backend API',
                status: res.ok ? 'success' : 'warning',
                message: res.ok ? 'Running' : 'Not responding correctly'
            });
        } catch {
            newChecks.push({
                name: 'Backend API',
                status: 'warning',
                message: 'Not running (normal for first run)'
            });
        }

        setChecks(newChecks);

        // Determine overall status
        const hasError = newChecks.some(c => c.status === 'error');
        const hasWarning = newChecks.some(c => c.status === 'warning');

        if (hasError) {
            setOverallStatus('offline');
            setCanProceed(false);
        } else if (hasWarning) {
            setOverallStatus('degraded');
            setCanProceed(true);
        } else {
            setOverallStatus('healthy');
            setCanProceed(true);
        }

        addLog('Client-side diagnosis complete');
    };

    const handleStartLmStudio = async () => {
        setIsStartingLmStudio(true);
        addLog('Attempting to start LM Studio...');

        try {
            const res = await fetch('/api/diagnose/lm-studio/start', {
                method: 'POST',
                signal: AbortSignal.timeout(10000)
            });

            const result = await res.json();

            if (result.success) {
                addLog('LM Studio started! Waiting for initialization...');

                // Update check status
                setChecks(prev => prev.map(c =>
                    c.name === 'LM Studio'
                        ? { ...c, status: 'checking' as const, message: 'Starting...' }
                        : c
                ));

                // Wait and retry detection
                for (let i = 1; i <= 6; i++) {
                    addLog(`Waiting for LM Studio... (${i * 5}s)`);
                    await new Promise(r => setTimeout(r, 5000));

                    // Check if LM Studio is now available
                    const ports = [1234, 1235, 8080];
                    for (const port of ports) {
                        try {
                            const checkRes = await fetch(`http://localhost:${port}/v1/models`, {
                                signal: AbortSignal.timeout(3000)
                            });
                            if (checkRes.ok) {
                                const data = await checkRes.json();
                                if (data.data?.length > 0) {
                                    addLog(`LM Studio ready on port ${port}!`);
                                    setChecks(prev => prev.map(c =>
                                        c.name === 'LM Studio'
                                            ? {
                                                ...c,
                                                status: 'success' as const,
                                                message: `Connected on port ${port}`,
                                                details: { port, model: data.data[0]?.id }
                                            }
                                            : c
                                    ));
                                    setIsStartingLmStudio(false);
                                    return;
                                }
                            }
                        } catch {
                            // Continue
                        }
                    }
                }

                // Timeout - LM Studio running but no model
                addLog('LM Studio started but no model loaded');
                setChecks(prev => prev.map(c =>
                    c.name === 'LM Studio'
                        ? {
                            ...c,
                            status: 'warning' as const,
                            message: 'Started - please load a model',
                            repair_action: 'Load a model in LM Studio'
                        }
                        : c
                ));
            } else {
                addLog(`Failed: ${result.message}`);
                setChecks(prev => prev.map(c =>
                    c.name === 'LM Studio'
                        ? { ...c, status: 'error' as const, message: result.message }
                        : c
                ));
            }
        } catch (error) {
            addLog('Could not contact backend to start LM Studio');

            // Try opening LM Studio link
            window.open('https://lmstudio.ai', '_blank');
        }

        setIsStartingLmStudio(false);
    };

    const handleRetry = async () => {
        setIsRepairing(true);
        addLog('Retrying all checks...');
        await runDiagnosis();
        setIsRepairing(false);
    };

    const handleProceed = () => {
        const result: DiagnosisResult = {
            status: overallStatus || 'degraded',
            checks,
            repair_actions: checks.filter(c => c.repair_action).map(c => c.repair_action!),
            can_proceed: canProceed
        };
        onComplete(result);
    };

    const getStatusIcon = (status: ConnectionCheck['status']) => {
        switch (status) {
            case 'pending':
                return <div className="w-5 h-5 rounded-full bg-slate-700" />;
            case 'checking':
                return <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />;
            case 'success':
                return <Check className="w-5 h-5 text-emerald-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
        }
    };

    const getCheckIcon = (name: string) => {
        switch (name) {
            case 'Internet Connectivity':
                return <Wifi className="w-5 h-5 text-slate-400" />;
            case 'LM Studio':
                return <Brain className="w-5 h-5 text-slate-400" />;
            case 'API Keys':
                return <Key className="w-5 h-5 text-slate-400" />;
            case 'Backend API':
                return <Server className="w-5 h-5 text-slate-400" />;
            default:
                return null;
        }
    };

    const allChecksComplete = checks.every(c => c.status !== 'pending' && c.status !== 'checking');
    const hasErrors = checks.some(c => c.status === 'error');
    const lmStudioCheck = checks.find(c => c.name === 'LM Studio');
    const showStartLmStudio = lmStudioCheck &&
        (lmStudioCheck.status === 'warning' || lmStudioCheck.status === 'error') &&
        !isStartingLmStudio;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                    Establishing Connections
                </h2>
                <p className="text-slate-400 text-sm">
                    Verifying and repairing connectivity issues...
                </p>
            </div>

            {/* Check List */}
            <div className="space-y-3">
                {checks.map((check, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg transition-all"
                    >
                        <div className="flex items-center space-x-3">
                            {getCheckIcon(check.name)}
                            <div>
                                <span className="text-slate-200 font-medium block">
                                    {check.name}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {check.message}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {check.details?.model && (
                                <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                    {String(check.details.model).split('/').pop()}
                                </span>
                            )}
                            {getStatusIcon(check.status)}
                        </div>
                    </div>
                ))}
            </div>

            {/* LM Studio Start Button */}
            {showStartLmStudio && (
                <div className="flex items-center justify-center space-x-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-300 text-sm">LM Studio not running</span>
                    <button
                        onClick={handleStartLmStudio}
                        disabled={isStartingLmStudio}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" />
                        <span>Start LM Studio</span>
                    </button>
                </div>
            )}

            {isStartingLmStudio && (
                <div className="flex items-center justify-center space-x-3 p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                    <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                    <span className="text-sky-300 text-sm">Starting LM Studio...</span>
                </div>
            )}

            {/* Repair Log */}
            {repairLog.length > 0 && (
                <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg">
                    <div className="text-xs font-mono text-slate-500 space-y-1 max-h-24 overflow-y-auto">
                        {repairLog.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Overall Status */}
            {overallStatus && allChecksComplete && (
                <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${overallStatus === 'healthy'
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : overallStatus === 'degraded'
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                    {overallStatus === 'healthy' && <Check className="w-5 h-5 text-emerald-400" />}
                    {overallStatus === 'degraded' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    {overallStatus === 'offline' && <XCircle className="w-5 h-5 text-red-400" />}
                    <span className={`font-medium ${overallStatus === 'healthy'
                            ? 'text-emerald-300'
                            : overallStatus === 'degraded'
                                ? 'text-amber-300'
                                : 'text-red-300'
                        }`}>
                        {overallStatus === 'healthy' && 'All systems operational'}
                        {overallStatus === 'degraded' && 'System operational with warnings'}
                        {overallStatus === 'offline' && 'Critical issues detected'}
                    </span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4 pt-2">
                <button
                    onClick={handleRetry}
                    disabled={isRepairing || isStartingLmStudio}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCcw className={`w-4 h-4 ${isRepairing ? 'animate-spin' : ''}`} />
                    <span>Retry All</span>
                </button>

                {(canProceed || overallStatus === 'healthy') && (
                    <button
                        onClick={handleProceed}
                        disabled={!allChecksComplete || isStartingLmStudio}
                        className="flex items-center space-x-2 px-6 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" />
                        <span>Continue</span>
                    </button>
                )}

                {hasErrors && !canProceed && (
                    <button
                        onClick={onSkip}
                        className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    >
                        Skip (Offline Mode)
                    </button>
                )}
            </div>
        </div>
    );
}
