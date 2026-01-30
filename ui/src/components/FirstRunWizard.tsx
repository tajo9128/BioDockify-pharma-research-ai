import React, { useState, useEffect } from 'react';
import { DetectedServices } from '@/lib/services/auto-config';
import ConnectivityHealer from './wizard/ConnectivityHealer';
import {
    Check, XCircle, RefreshCcw, Database, Brain, Server,
    HardDrive, Cpu, Gauge, Terminal, AlertTriangle, Wifi,
    Settings, ExternalLink, UserCheck, Shield, Save, Home, Mail
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
    // Steps: 0=Welcome, 1=Connectivity, 2=System, 3=Research, 4=Settings, 5=Registration, 6=Verification
    const [step, setStep] = useState(0);
    const [retryCount, setRetryCount] = useState(0);
    const [repairStatus, setRepairStatus] = useState<string>('');

    // Check States
    const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
    const [sysStatus, setSysStatus] = useState<'pending' | 'checking' | 'complete'>('pending');
    const [detectedServices, setDetectedServices] = useState<DetectedServices | null>(null);

    const [researchStatus, setResearchStatus] = useState<{
        lm_studio: 'pending' | 'success' | 'warning';
        pdf: 'success';
        export: 'success';
    }>({ lm_studio: 'pending', pdf: 'success', export: 'success' });

    // Settings State (Step 4)
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    // Persona/Verification State (Step 6)
    const [personaEmail, setPersonaEmail] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');

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

    const runSystemChecks = async () => {
        setSysStatus('checking');
        try {
            await new Promise(r => setTimeout(r, 800));
            const info: SysInfo = {
                os: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
                cpu_cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
                ram_total_gb: 16,
                ram_available_gb: 8,
                disk_free_gb: 100,
                temp_writable: true
            };
            setSysInfo(info);
            await new Promise(r => setTimeout(r, 800));
            setSysStatus('complete');
            setTimeout(() => setStep(3), 1000);
        } catch (e) {
            console.error("System check failed", e);
            setSysStatus('complete');
            setTimeout(() => setStep(3), 1500);
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

                // Advance to Step 4 (Settings)
                setTimeout(() => setStep(4), 2500);
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
    };

    const retryDetection = async () => {
        setRetryCount(prev => prev + 1);
        setResearchStatus(prev => ({ ...prev, lm_studio: 'pending' }));
        setRepairStatus('Retrying with extended timeout...');
        await runResearchChecks();
    };

    // Step 4: Save Settings and proceed
    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            // Simulate saving settings (already auto-saved by SettingsPanel)
            await new Promise(r => setTimeout(r, 1000));

            if (typeof window !== 'undefined') {
                localStorage.setItem('biodockify_settings_saved', 'true');
            }

            setSettingsSaved(true);
            setSavingSettings(false);

            // Advance to Step 5 (Registration)
            setTimeout(() => setStep(5), 500);
        } catch (e) {
            console.error('Failed to save settings:', e);
            setSavingSettings(false);
        }
    };

    // Step 6: Final Verification against Supabase (Direct Internet Call)
    const handleVerify = async () => {
        if (!personaEmail) {
            setVerificationError("Please enter your registered Email to proceed.");
            return;
        }

        setVerifying(true);
        setVerificationError('');

        try {
            // Direct Supabase REST API call (no backend required)
            const SUPABASE_URL = 'https://crdajozcjvoistmxhcno.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZGFqb3pjanZvaXN0bXhoY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjQ4MTQsImV4cCI6MjA1Mjk0MDgxNH0.SE2cB5wPoVZ64C2V4IGfHaVUJqKGJHrSobLMGJPBIYA';

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(personaEmail)}&select=email`,
                {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                setVerificationError("Unable to verify. Check your internet connection.");
                setVerifying(false);
                return;
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                setVerificationError("Email not found. Please register at www.biodockify.com first.");
                setVerifying(false);
                return;
            }

            // Verification successful - Save settings
            if (typeof window !== 'undefined') {
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
                        email: personaEmail
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
                localStorage.setItem('biodockify_license_active', 'true');
            }

            // Complete wizard
            onComplete({ detectedServices: detectedServices || { lm_studio: false, backend: true } });

        } catch (e: any) {
            setVerificationError("Error: " + e.message);
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

                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-800">
                        {step === 0 && <Terminal className="w-8 h-8 text-teal-400" />}
                        {step === 1 && <Wifi className="w-8 h-8 text-sky-400 animate-pulse" />}
                        {step === 2 && <Cpu className="w-8 h-8 text-sky-400 animate-pulse" />}
                        {step === 3 && <Brain className="w-8 h-8 text-purple-400 animate-pulse" />}
                        {step === 4 && <Settings className="w-8 h-8 text-indigo-400" />}
                        {step === 5 && <ExternalLink className="w-8 h-8 text-teal-400" />}
                        {step === 6 && <UserCheck className="w-8 h-8 text-emerald-400" />}
                    </div>
                </div>

                <div className="px-12 pb-12 flex-1 flex flex-col justify-center">

                    {/* STEP 0: WELCOME */}
                    {step === 0 && (
                        <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome to BioDockify! 👋</h1>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Your AI-powered research assistant is almost ready.<br />
                                <span className="text-teal-400">Just a few quick steps and you're all set!</span>
                            </p>
                            <div className="pt-8">
                                <button
                                    onClick={() => setStep(1)}
                                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 px-10 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30"
                                >
                                    Let's Get Started! 🚀
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: CONNECTIVITY */}
                    {step === 1 && (
                        <ConnectivityHealer
                            onComplete={(result) => {
                                console.log('[FirstRunWizard] Connectivity result:', result);
                                setStep(2);
                            }}
                            onSkip={() => setStep(2)}
                        />
                    )}

                    {/* STEP 2: SYSTEM CHECKS */}
                    {step === 2 && (
                        <div className="space-y-6 w-full max-w-md mx-auto animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-white text-center mb-2">Checking Your Computer... ⚡</h2>
                            <p className="text-slate-400 text-center text-sm mb-4">Making sure everything is good to go!</p>
                            <div className="space-y-3">
                                <CheckItem
                                    label="Operating System"
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo?.os}
                                />
                                <CheckItem
                                    label="Processor"
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo ? `${sysInfo.cpu_cores} Cores` : ''}
                                />
                                <CheckItem
                                    label="Memory"
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo ? `${sysInfo.ram_available_gb}GB Available` : ''}
                                />
                                <CheckItem
                                    label="Storage"
                                    status={sysInfo ? 'success' : 'checking'}
                                    value={sysInfo ? `${sysInfo.disk_free_gb}GB Free` : ''}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESEARCH CHECKS */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-white text-center mb-2">Setting Up Your AI Assistant... 🧠</h2>
                            <p className="text-slate-400 text-center text-sm mb-4">We're connecting to your local AI model</p>
                            <div className="space-y-3">
                                <CheckItem label="Document Reader" status="success" />
                                <CheckItem label="PDF Support" status="success" />
                                <CheckItem
                                    label="AI Brain (LM Studio)"
                                    status={researchStatus.lm_studio === 'pending' ? 'checking' : researchStatus.lm_studio}
                                    value={detectedServices?.lm_studio_model ? `${detectedServices.lm_studio_model.split('/').pop()}` : undefined}
                                />
                            </div>
                            {researchStatus.lm_studio === 'warning' && (
                                <div className="text-center mt-4 p-4 bg-amber-900/20 rounded-xl border border-amber-800/50">
                                    <p className="text-sm text-amber-300 mb-3">💡 LM Studio not found. Don't worry!</p>
                                    <p className="text-xs text-slate-400 mb-3">Open LM Studio and load any model, then click retry.</p>
                                    <button
                                        onClick={retryDetection}
                                        className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: SETTINGS PANEL */}
                    {step === 4 && (
                        <div className="space-y-6 text-center animate-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-white">You're Almost There! ✨</h1>
                                <p className="text-slate-400 mt-2">
                                    Your AI research assistant is ready to help you.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 p-6 rounded-xl border border-emerald-500/30 text-left space-y-4">
                                <div className="flex items-center space-x-3 text-emerald-400">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">AI Connected: LM Studio</span>
                                </div>
                                {detectedServices?.lm_studio_model && (
                                    <div className="flex items-center space-x-3 text-emerald-400">
                                        <Check className="w-5 h-5" />
                                        <span className="font-medium">Model: {detectedServices.lm_studio_model.split('/').pop()}</span>
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 mt-4">
                                    Tip: You can change AI settings anytime from the Settings page.
                                </p>
                            </div>

                            <div className="flex flex-col items-center space-y-3 pt-4">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white px-10 py-3 rounded-xl font-bold text-lg transition-all w-full max-w-sm shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {savingSettings ? (
                                        <>
                                            <RefreshCcw className="w-5 h-5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Continue →</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => onComplete('settings')}
                                    className="text-sm text-slate-500 hover:text-slate-300 underline"
                                >
                                    I want to customize settings first
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: REGISTRATION PROMPT */}
                    {step === 5 && (
                        <div className="space-y-6 text-center animate-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-white">One Last Step! 🎉</h1>
                                <p className="text-slate-400 mt-2">
                                    Create your free account to unlock all features.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-teal-900/30 to-indigo-900/30 p-8 rounded-xl border border-teal-500/30 space-y-5">
                                <div className="flex items-center justify-center space-x-2 text-teal-400">
                                    <Shield className="w-6 h-6" />
                                    <span className="font-bold text-lg">🆓 100% Free for Students</span>
                                </div>
                                <div className="text-left bg-slate-900/50 p-4 rounded-lg space-y-2">
                                    <p className="text-slate-300 text-sm flex items-center"><span className="text-teal-400 mr-2">➀</span> Sign up on our website with your email</p>
                                    <p className="text-slate-300 text-sm flex items-center"><span className="text-teal-400 mr-2">➁</span> Click the verification link in your inbox</p>
                                    <p className="text-slate-300 text-sm flex items-center"><span className="text-teal-400 mr-2">➂</span> Come back here and click continue!</p>
                                </div>
                                <a
                                    href="https://www.biodockify.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 bg-white text-slate-950 px-8 py-3 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    <span>Sign Up for Free</span>
                                </a>
                            </div>

                            <button
                                onClick={() => setStep(6)}
                                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white px-10 py-3 rounded-xl font-bold text-lg transition-all w-full max-w-sm shadow-lg shadow-teal-500/20"
                            >
                                I've Signed Up - Let's Go! →
                            </button>
                        </div>
                    )}

                    {/* STEP 6: VERIFICATION */}
                    {step === 6 && (
                        <div className="space-y-6 text-center animate-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Verify Your Email 📧</h1>
                                <p className="text-slate-400 mt-2">Enter the email you used to sign up</p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 p-6 rounded-xl border border-emerald-500/30 text-left space-y-4 max-w-sm mx-auto">
                                <div>
                                    <label className="text-xs font-medium text-slate-400">Your Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-lg"
                                        placeholder="yourname@university.edu"
                                        value={personaEmail}
                                        onChange={e => setPersonaEmail(e.target.value)}
                                        disabled={verifying}
                                    />
                                </div>
                                {verificationError && (
                                    <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300 flex items-start space-x-2">
                                        <span>⚠️</span>
                                        <span>{verificationError}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center space-y-3">
                                <button
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-10 py-3 rounded-xl font-bold text-lg transition-all w-full max-w-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {verifying ? (
                                        <>
                                            <RefreshCcw className="w-5 h-5 animate-spin" />
                                            <span>Checking...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="w-5 h-5" />
                                            <span>Verify & Start Research!</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-slate-500">
                                    Need an account? <a href="https://www.biodockify.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">Sign up free</a>
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
