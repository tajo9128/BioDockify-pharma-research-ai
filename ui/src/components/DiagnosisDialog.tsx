/**
 * Diagnosis & Repair Dialog
 * 
 * Implements the UI for Agent Zero Self-Repair Workflow.
 * Enforces the strict "Ask First" protocol.
 * 
 * Flow:
 * 1. Intro (Consent to Diagnose)
 * 2. Scaning (Read-only)
 * 3. Report & Plan (Consent to Repair)
 * 4. Cleaning/Repairing
 * 5. Summary
 */

'use client';

import React, { useState } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Cpu,
    Database,
    Shield,
    XOctagon,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { DiagnosticEngine, DiagnosticReport } from '@/lib/diagnostics';
import { RepairManager, RepairPlan, RepairResult } from '@/lib/repair-system';

interface DiagnosisDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

type WizardStep = 'intro' | 'scanning' | 'report' | 'repairing' | 'summary';

export default function DiagnosisDialog({ isOpen, onClose }: DiagnosisDialogProps) {
    const [step, setStep] = useState<WizardStep>('intro');
    const [report, setReport] = useState<DiagnosticReport | null>(null);
    const [plan, setPlan] = useState<RepairPlan | null>(null);
    const [result, setResult] = useState<RepairResult | null>(null);

    // Services
    const diagnosticEngine = DiagnosticEngine.getInstance();
    const repairManager = RepairManager.getInstance();

    if (!isOpen) return null;

    // ------------------------------------------------------------------------
    // Step Actions
    // ------------------------------------------------------------------------

    const startDiagnosis = async () => {
        setStep('scanning');
        // Add visual delay for "calm" UX
        await new Promise(r => setTimeout(r, 800));

        const diagnosis = await diagnosticEngine.runDiagnosis();
        setReport(diagnosis);

        if (diagnosis.issuesFound) {
            const proposedPlan = repairManager.createRepairPlan(diagnosis);
            setPlan(proposedPlan);
        } else {
            setPlan(null);
        }

        // Brief pause before showing results
        await new Promise(r => setTimeout(r, 500));
        setStep('report');
    };

    const startRepair = async () => {
        if (!plan) return;
        setStep('repairing');

        const repairResult = await repairManager.executeRepairPlan(plan);
        setResult(repairResult);
        setStep('summary');
    };

    // ------------------------------------------------------------------------
    // UI Helpers
    // ------------------------------------------------------------------------

    const renderStatusIcon = (status: string) => {
        switch (status) {
            case 'ok': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 'error': return <XOctagon className="w-5 h-5 text-red-500" />;
            default: return <Activity className="w-5 h-5 text-slate-500" />;
        }
    };

    // ------------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------------

    const renderIntro = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">System Diagnostic</h2>
                    <p className="text-slate-400">Agent Zero Self-Repair</p>
                </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-300 leading-relaxed">
                    I can diagnose local services (Ollama, Neo4j, Models) to identify connection issues.
                    I will not make any changes to your system without your explicit approval in the next step.
                </p>
            </div>

            <div className="flex space-x-3 pt-4">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={startDiagnosis}
                    className="flex-1 py-3 px-4 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <Activity className="w-4 h-4" />
                    <span>Start Diagnosis</span>
                </button>
            </div>
        </div>
    );

    const renderScanning = () => (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-sky-500 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
                <h3 className="text-lg font-medium text-white">Scanning System...</h3>
                <p className="text-slate-500 mt-1">Checking services and connections</p>
            </div>
        </div>
    );

    const renderReport = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-sky-400" />
                Diagnosis Results
            </h3>

            {/* Check List */}
            <div className="space-y-2 bg-slate-900/50 rounded-lg p-2 max-h-[200px] overflow-y-auto">
                {report?.checks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-800">
                        <div className="flex items-center space-x-3">
                            {renderStatusIcon(check.status)}
                            <span className="text-slate-300 font-medium">{check.name}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{check.message}</span>
                    </div>
                ))}
            </div>

            {/* Repair Plan Proposal */}
            {plan && plan.actions.length > 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-amber-400 font-bold flex items-center">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Repair Plan Proposed
                        </h4>
                        <span className="text-xs text-amber-500/80 px-2 py-1 bg-amber-500/10 rounded uppercase">
                            Risk: {plan.estimatedRisk}
                        </span>
                    </div>

                    <p className="text-sm text-slate-300">{plan.explanation}</p>

                    <ul className="space-y-1">
                        {plan.actions.map(action => (
                            <li key={action.id} className="text-sm text-slate-400 flex items-start">
                                <span className="mr-2 text-amber-500">•</span>
                                {action.description}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <p className="text-emerald-400 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        System is healthy. No repairs needed.
                    </p>
                </div>
            )}

            <div className="flex space-x-3 pt-2">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                >
                    {plan ? 'Cancel Repair' : 'Close'}
                </button>
                {plan && (
                    <button
                        onClick={startRepair}
                        className="flex-1 py-3 px-4 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors flex items-center justify-center space-x-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Approve Repair</span>
                    </button>
                )}
            </div>
        </div>
    );

    const renderRepairing = () => (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-amber-500 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
                <h3 className="text-lg font-medium text-white">Repairing System...</h3>
                <p className="text-slate-500 mt-1">Applying approved fixes safely</p>
            </div>
        </div>
    );

    const renderSummary = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result?.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                    {result?.success ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Repair Complete</h2>
                    <p className={result?.success ? 'text-emerald-400' : 'text-red-400'}>
                        {result?.success ? 'All systems verified' : 'Some issues persist'}
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 space-y-3">
                <h4 className="text-sm font-semibold text-slate-400 uppercase">Actions Taken</h4>
                <div className="space-y-2">
                    {result?.actionsTaken.map((action, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{action.description}</span>
                            <span className={action.success ? 'text-emerald-500' : 'text-red-500'}>
                                {action.success ? 'Success' : 'Failed'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 space-y-3">
                <h4 className="text-sm font-semibold text-slate-400 uppercase">Verification</h4>
                <div className="space-y-1">
                    {result?.verificationResult.checks.map(check => (
                        <div key={check.id} className="flex items-center text-sm">
                            {renderStatusIcon(check.status)}
                            <span className="ml-2 text-slate-400">{check.name}: {check.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
            >
                Close & Return to Chat
            </button>
        </div>
    );

    // ------------------------------------------------------------------------
    // Main Render
    // ------------------------------------------------------------------------

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Safe Mode Indicator (Header) */}
                <div className="bg-slate-800 px-6 py-2 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                            Safe Mode Active
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    {step === 'intro' && renderIntro()}
                    {step === 'scanning' && renderScanning()}
                    {step === 'report' && renderReport()}
                    {step === 'repairing' && renderRepairing()}
                    {step === 'summary' && renderSummary()}
                </div>
            </div>
        </div>
    );
}
