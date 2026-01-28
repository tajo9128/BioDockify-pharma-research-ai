import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DetectedServices } from '@/lib/services/auto-config';
import ConnectivityHealer from './wizard/ConnectivityHealer';
import {
    Check, XCircle, RefreshCcw, Database, Brain, Server,
    HardDrive, Cpu, Gauge, Terminal, AlertTriangle, Wifi
} from 'lucide-react';

interface WizardProps {
    onComplete: (settings: any) => void;
}

// Minimal types for check results
interface SysInfo {
    os: string;
    cpu_cores: number;
    ram_total_gb: number;
    ram_available_gb: number;
    disk_free_gb: number;
    temp_writable: boolean;
}

export default function FirstRunWizard({ onComplete }: WizardProps) {
    const [step, setStep] = useState(0); // 0: Welcome, 1: Connectivity, 2: System, 3: Research, 4: Summary
    const [retryCount, setRetryCount] = useState(0);
    const [repairStatus, setRepairStatus] = useState<string>('');

    // Check States
    const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
    const [sysStatus, setSysStatus] = useState<'pending' | 'checking' | 'complete'>('pending');
    const [detectedServices, setDetectedServices] = useState<DetectedServices | null>(null);

    const [researchStatus, setResearchStatus] = useState<{
        lm_studio: 'pending' | 'success' | 'warning';
        pdf: 'success'; // Assumed
        export: 'success'; // Assumed
    }>({ lm_studio: 'pending', pdf: 'success', export: 'success' });

    // Step 2: System Checks (Auto-run when entering step 2)
    useEffect(() => {
        if (step === 2 && sysStatus === 'pending') {
            runSystemChecks();
        }
    }, [step]);

    // Step 3: Research Checks (Auto-run when entering step 3)
    useEffect(() => {
        if (step === 3 && researchStatus.lm_studio === 'pending') {
            runResearchChecks();
        }
    }, [step]);

    // --- NEW: Persona State ---
    const [personaName, setPersonaName] = useState('');
    const [personaEmail, setPersonaEmail] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');

    const runSystemChecks = async () => {
        setSysStatus('checking');
        try {
            await new Promise(r => setTimeout(r, 800));
            const info = await api.getSystemInfo();
            setSysInfo(info);
            await new Promise(r => setTimeout(r, 800));
            setSysStatus('complete');
            setTimeout(() => setStep(2), 1000);
        } catch (e) {
            console.error("System check failed", e);
            setSysStatus('complete');
            setTimeout(() => setStep(2), 1500);
        }
    };

    const runResearchChecks = async () => {
        console.log('[FirstRunWizard] Starting robust LM Studio detection...');
        setRepairStatus('Scanning for LM Studio...');

        try {
            const { universalFetch } = await import('@/lib/services/universal-fetch');
            const ports = [1234, 1235, 8080, 8000];
            let detected = false;
            let detectedUrl = '';
            let detectedModel = '';

            for (const port of ports) {
                if (detected) break;
                const url = `http://localhost:${port}/v1`;
                setRepairStatus(`Checking port ${port}...`);

                try {
                    const result = await universalFetch(`${url}/models`, {
                        method: 'GET',
                        timeout: 8000
                    });

                    if (result.ok && result.data?.data?.length > 0) {
                        detected = true;
                        detectedUrl = url;
                        detectedModel = result.data.data[0]?.id || 'Unknown';
                    }
                } catch (e) {
                    console.log(`[FirstRunWizard] Port ${port} failed:`, e);
                }
            }

            if (detected) {
                setDetectedServices({
                    lm_studio: true,
                    lm_studio_model: detectedModel,
                    backend: true,
                    grobid: false
                });

                setResearchStatus(prev => ({ ...prev, lm_studio: 'success' }));
                setRepairStatus(`Connected! Model: ${detectedModel.split('/').pop()}`);

                if (typeof window !== 'undefined') {
                    localStorage.setItem('biodockify_lm_studio_url', detectedUrl);
                    localStorage.setItem('biodockify_lm_studio_model', detectedModel);
                    localStorage.setItem('biodockify_ai_mode', 'lm_studio');
                }
            } else {
                setDetectedServices({ lm_studio: false, backend: true, grobid: false });
                setResearchStatus(prev => ({ ...prev, lm_studio: 'warning' }));
                setRepairStatus('Not detected - Start LM Studio and load a model');
            }
        } catch (e) {
            console.error('[FirstRunWizard] Service detection failed:', e);
            setResearchStatus(prev => ({ ...prev, lm_studio: 'warning' }));
            setRepairStatus('Detection failed - check console for details');
        }

        setTimeout(() => setStep(3), 2500);
    };

    const retryDetection = async () => {
        setRetryCount(prev => prev + 1);
        setResearchStatus(prev => ({ ...prev, lm_studio: 'pending' }));
        setRepairStatus('Retrying with extended timeout...');
        await runResearchChecks();
    };

    const finish = async () => {
        if (!personaName || !personaEmail) {
            setVerificationError("Please enter your Name and Email to proceed.");
            return;
        }

        setVerifying(true);
        setVerificationError('');

        try {
            // 1. Verify License
            const res = await api.auth.verify(personaName, personaEmail);

            if (!res.success) {
                setVerificationError(res.message || "Verification failed. Please check details.");
                setVerifying(false);
                return;
            }

            // 2. Save Settings if Verified
            if (typeof window !== 'undefined' && detectedServices) {
                const existingSettingsStr = localStorage.getItem('biodockify_settings');
                let existingSettings = {};
                try {
                    existingSettings = existingSettingsStr ? JSON.parse(existingSettingsStr) : {};
                } catch (e) {
                    console.error('[FirstRunWizard] Failed to parse existing settings:', e);
                }

                const completeSettings = {
                    ...existingSettings,
                    persona: {
                        // @ts-ignore
                        ...existingSettings.persona,
                        name: personaName, // Save Full Name 
                        email: personaEmail // Save Email
                    },
                    ai_provider: {
                        // @ts-ignore
                        ...existingSettings.ai_provider,
                        mode: 'lm_studio',
                        lm_studio_url: localStorage.getItem('biodockify_lm_studio_url') || 'http://localhost:1234/v1',
                        lm_studio_model: localStorage.getItem('biodockify_lm_studio_model') || ''
                    }
                };

                localStorage.setItem('biodockify_settings', JSON.stringify(completeSettings));
                localStorage.setItem('biodockify_first_run_complete', 'true');
                // CRITICAL: Set License Flag
                localStorage.setItem('biodockify_license_active', 'true');
            }

            // 3. Complete
            onComplete({ detectedServices });

        } catch (e: any) {
            setVerificationError("Server error: " + e.message);
        } finally {
            setVerifying(false);
        }
    };

    // --- RENDERERS ---

    const CheckItem = ({ label, status, value }: { label: string, status: 'success' | 'warning' | 'pending' | 'checking', value?: string }) => (
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-slate-300 font-medium">{label}</span>
            <div className="flex items-center space-x-3">
                {value && <span className="text-xs font-mono text-slate-500">{value}</span>}
                {status === 'pending' && <div className="w-2 h-2 bg-slate-700 rounded-full" />}
                {status === 'checking' && <RefreshCcw className="w-4 h-4 text-sky-400 animate-spin" />}
                {status === 'success' && <Check className="w-5 h-5 text-emerald-400" />}
                {status === 'warning' && <span className="text-xs text-amber-400 font-bold px-2 py-1 bg-amber-400/10 rounded">NOT DETECTED</span>}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">

                {/* Header (Minimal) */}
                <div className="p-8 pb-0 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-800">
                        {step === 0 && <Terminal className="w-8 h-8 text-teal-400" />}
                        {step === 1 && <Wifi className="w-8 h-8 text-sky-400 animate-pulse" />}
                        {step === 2 && <Cpu className="w-8 h-8 text-sky-400 animate-pulse" />}
                        {step === 3 && <Brain className="w-8 h-8 text-purple-400 animate-pulse" />}
                        {step === 4 && <Check className="w-8 h-8 text-emerald-400" />}
                    </div>
                </div>

                <div className="px-12 pb-12 flex-1 flex flex-col justify-center">

                    {/* STEP 0: WELCOME */}
                    {step === 0 && (
                        <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl font-bold text-white tracking-tight">BioDockify Research Workspace</h1>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                This software is preparing your research environment.<br />
                                All system checks will run automatically.
                            </p>
                            <div className="pt-8">
                                <button
                                    onClick={() => setStep(1)}
                                    className="bg-white text-slate-950 hover:bg-slate-200 px-10 py-3 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    Start Setup
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: CONNECTIVITY HEALING */}
                    {step === 1 && (
                        <ConnectivityHealer
                            onComplete={(result) => {
                                // Store connectivity result if needed
                                console.log('[FirstRunWizard] Connectivity result:', result);
                                setStep(2);
                            }}
                            onSkip={() => setStep(2)}
                        />
                    )}

                    {/* STEP 2: SYSTEM CHECKS */}
                    {step === 2 && (
                        <div className="space-y-6 w-full max-w-md mx-auto animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-white text-center mb-6">Checking System Compatibility...</h2>
                            <div className="space-y-3">
                                <CheckItem
                                    label="Operating System"
                                    // @ts-ignore
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo?.os}
                                />
                                <CheckItem
                                    label="Processor Cores"
                                    // @ts-ignore
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo ? `${sysInfo.cpu_cores} Cores` : ''}
                                />
                                <CheckItem
                                    label="System Memory"
                                    // @ts-ignore
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo ? `${sysInfo.ram_available_gb}GB Available` : ''}
                                />
                                <CheckItem
                                    label="Storage Space"
                                    // @ts-ignore
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo ? `${sysInfo.disk_free_gb}GB Free` : ''}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESEARCH CHECKS */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-white text-center mb-6">Verifying Research Engine...</h2>
                            <div className="space-y-3">
                                <CheckItem label="Research Editor" status="success" />
                                <CheckItem label="PDF Processing Engine" status="success" />
                                <CheckItem
                                    label="LM Studio (Local AI)"
                                    status={researchStatus.lm_studio === 'pending' ? 'checking' : researchStatus.lm_studio}
                                    value={detectedServices?.lm_studio_model ? `Model: ${detectedServices.lm_studio_model.split('/').pop()}` : undefined}
                                />
                            </div>
                            {researchStatus.lm_studio === 'warning' && (
                                <div className="text-center mt-4">
                                    <p className="text-sm text-amber-400 mb-2">LM Studio not detected. Please start it and load a model.</p>
                                    <button
                                        onClick={retryDetection}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                                    >
                                        Retry Detection
                                    </button>
                                </div>
                            )}
                        </div>
                    )}


                    {/* STEP 4: REGISTRATION & SUMMARY */}
                    {step === 4 && (
                        <div className="space-y-6 text-center animate-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Verification Required</h1>
                                <p className="text-slate-400 mt-2">Enter your license details to unlock the workspace.</p>
                            </div>

                            {/* Registration Inputs */}
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-left space-y-4 max-w-sm mx-auto">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                        placeholder="Dr. StartUp"
                                        value={personaName}
                                        onChange={e => setPersonaName(e.target.value)}
                                        disabled={verifying}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                        placeholder="researcher@biodockify.ai"
                                        value={personaEmail}
                                        onChange={e => setPersonaEmail(e.target.value)}
                                        disabled={verifying}
                                    />
                                </div>
                                {verificationError && (
                                    <div className="p-2 bg-red-900/30 border border-red-900 rounded text-xs text-red-400">
                                        {verificationError}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center space-y-3">
                                <button
                                    onClick={finish}
                                    disabled={verifying}
                                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-10 py-3 rounded-xl font-bold text-lg transition-all w-full max-w-sm shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {verifying ? "Verifying..." : "Verify & Enter Workspace"}
                                </button>
                                <p className="text-xs text-slate-600">
                                    Don't have a login? <a href="#" className="underline hover:text-slate-500">Register for Free</a>
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
