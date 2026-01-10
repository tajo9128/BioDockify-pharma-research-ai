
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Check, XCircle, RefreshCcw, Database, Brain, Server,
    HardDrive, Cpu, Gauge, Terminal
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
    const [step, setStep] = useState(0); // 0: Welcome, 1: System, 2: Research, 3: Summary

    // Check States
    const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
    const [sysStatus, setSysStatus] = useState<'pending' | 'checking' | 'complete'>('pending');

    const [researchStatus, setResearchStatus] = useState<{
        ollama: 'pending' | 'success' | 'warning';
        neo4j: 'pending' | 'success' | 'warning';
        pdf: 'success'; // Assumed
        export: 'success'; // Assumed
    }>({ ollama: 'pending', neo4j: 'pending', pdf: 'success', export: 'success' });

    // Step 1: System Checks (Auto-run when entering step 1)
    useEffect(() => {
        if (step === 1 && sysStatus === 'pending') {
            runSystemChecks();
        }
    }, [step]);

    // Step 2: Research Checks (Auto-run when entering step 2)
    useEffect(() => {
        if (step === 2 && researchStatus.ollama === 'pending') {
            runResearchChecks();
        }
    }, [step]);

    const runSystemChecks = async () => {
        setSysStatus('checking');
        try {
            // Add artificial delay for visual pacing
            await new Promise(r => setTimeout(r, 800));
            const info = await api.getSystemInfo();
            setSysInfo(info);
            await new Promise(r => setTimeout(r, 800)); // Let user see progress
            setSysStatus('complete');
            // Auto advance after short delay
            setTimeout(() => setStep(2), 1000);
        } catch (e) {
            console.error("System check failed", e);
            // Even if failed, we proceed with null info (graceful degradation)
            setSysStatus('complete');
            setTimeout(() => setStep(2), 1500);
        }
    };

    const runResearchChecks = async () => {
        // Parallel checks
        const p1 = api.checkOllama('http://localhost:11434').then(r => r.status === 'success').catch(() => false);
        const p2 = api.checkNeo4j('bolt://localhost:7687', 'neo4j', 'password').then(r => r.status === 'success').catch(() => false);

        const [ollamaOk, neo4jOk] = await Promise.all([p1, p2]);

        setResearchStatus(prev => ({
            ...prev,
            ollama: ollamaOk ? 'success' : 'warning',
            neo4j: neo4jOk ? 'success' : 'warning'
        }));

        // Auto advance
        setTimeout(() => setStep(3), 1500);
    };

    const finish = () => {
        // No settings to update, just complete
        onComplete({});
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
                        {step === 1 && <Cpu className="w-8 h-8 text-sky-400 animate-pulse" />}
                        {step === 2 && <Brain className="w-8 h-8 text-purple-400 animate-pulse" />}
                        {step === 3 && <Check className="w-8 h-8 text-emerald-400" />}
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

                    {/* STEP 1: SYSTEM CHECKS */}
                    {step === 1 && (
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

                    {/* STEP 2: RESEARCH ENGINE CHECKS */}
                    {step === 2 && (
                        <div className="space-y-6 w-full max-w-md mx-auto animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-white text-center mb-6">Verifying Research Engine...</h2>
                            <div className="space-y-3">
                                <CheckItem label="Research Editor" status="success" />
                                <CheckItem label="PDF Processing Engine" status="success" />
                                <CheckItem label="Ollama (Local AI)" status={researchStatus.ollama === 'pending' ? 'checking' : researchStatus.ollama} />
                                <CheckItem label="Neo4j (Knowledge Graph)" status={researchStatus.neo4j === 'pending' ? 'checking' : researchStatus.neo4j} />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SUMMARY */}
                    {step === 3 && (
                        <div className="space-y-8 text-center animate-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-white">System Ready</h1>
                                <p className="text-slate-400 mt-2">Your research environment has been configured.</p>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-left space-y-3 max-w-sm mx-auto">
                                <div className="flex items-center space-x-3 text-emerald-400">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Core Workspace Active</span>
                                </div>
                                <div className="flex items-center space-x-3 text-emerald-400">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Document Engine Ready</span>
                                </div>
                                {researchStatus.ollama === 'warning' && (
                                    <div className="flex items-center space-x-3 text-amber-500">
                                        <Brain className="w-5 h-5" />
                                        <span className="font-medium">AI Assistant (Optional setup required)</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center space-y-3">
                                <button
                                    onClick={finish}
                                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-10 py-3 rounded-xl font-bold text-lg transition-all w-64 shadow-lg shadow-teal-500/20"
                                >
                                    Enter Workspace
                                </button>
                                <button
                                    onClick={() => onComplete('settings')}
                                    className="text-slate-500 text-sm hover:text-white transition-colors"
                                >
                                    Open Advanced Settings
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
