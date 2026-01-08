
import React from 'react';
import { AlertTriangle, Download, Mail, RefreshCw, Shield, X } from 'lucide-react';
import { generateReport, downloadReport, openEmailClient, DiagnosisReport } from '@/lib/diagnostics';

interface DiagnosisDialogProps {
    isOpen: boolean;
    onClose: () => void;
    error: Error | string | null;
    component?: string;
    code?: string;
    onRetry?: () => void;
    onSafeMode?: () => void;
}

export default function DiagnosisDialog({
    isOpen, onClose, error,
    component = "System",
    code = "SYS_ERR_001",
    onRetry,
    onSafeMode
}: DiagnosisDialogProps) {
    if (!isOpen || !error) return null;

    const handleReport = () => {
        // 1. Generate
        const report = generateReport(error, component, "User triggered diagnostics", code);
        // 2. Download
        downloadReport(report);
        // 3. Email
        // Small delay to ensure download starts
        setTimeout(() => {
            openEmailClient(report);
        }, 1000);
    };

    const errorMessage = error instanceof Error ? error.message : error;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">

                {/* Header */}
                <div className="bg-red-950/30 border-b border-red-900/20 p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white tracking-tight">Problem Detected</h2>
                        <p className="text-red-300 text-sm mt-1">{component} encountered an issue.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Reason Section */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</h3>
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                            <p className="text-slate-200 font-medium text-sm">{errorMessage}</p>
                            <p className="text-xs text-slate-500 mt-1 font-mono">{code}</p>
                        </div>
                    </div>

                    {/* Impact Section */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Impact</h3>
                        <p className="text-slate-300 text-sm">
                            You can continue using other parts of the system.
                            {onSafeMode && " Safe Mode is available."}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-sm font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> Retry
                            </button>
                        )}

                        {onSafeMode ? (
                            <button
                                onClick={onSafeMode}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm font-medium transition-colors"
                            >
                                <Shield className="w-4 h-4" /> Continue (Safe Mode)
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-sm font-medium transition-colors"
                            >
                                Continue Without AI
                            </button>
                        )}

                        <button
                            onClick={handleReport}
                            className="col-span-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-lg text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]"
                        >
                            <Mail className="w-4 h-4" /> Report This Issue via Email
                        </button>
                    </div>

                    <p className="text-[10px] text-center text-slate-500">
                        Reporting generates a report file and opens your email client. <br />
                        Please attach the downloaded file to the email.
                    </p>

                </div>
            </div>
        </div>
    );
}
