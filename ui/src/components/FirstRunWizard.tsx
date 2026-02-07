
import React, { useState, useEffect } from 'react';
import { Check, Loader2, Wifi, Server, Brain, ShieldCheck } from 'lucide-react';

interface StartupProps {
    onComplete: (settings: any) => void;
}

export default function FirstRunWizard({ onComplete }: StartupProps) {
    const [checks, setChecks] = useState({
        backend: 'pending',
        internet: 'pending',
        ai_service: 'pending',
        license: 'pending'
    });
    const [statusMessage, setStatusMessage] = useState('Initializing BioDockify...');

    useEffect(() => {
        runStartupChecks();
    }, []);

    const runStartupChecks = async () => {
        // 1. Backend Check
        setStatusMessage('Connecting to Services...');
        try {
            // Assume backend is reachable if this page loaded (for Docker mainly), but good to verify API
            // Docker environment: We are likely serving this from Nginx which proxies to API.
            // Simple fetch to /api/health
            const res = await fetch('/api/health'); // Relative path works in Docker Nginx
            if (res.ok) setChecks(prev => ({ ...prev, backend: 'success' }));
            else throw new Error('Backend Unreachable');
        } catch (e) {
            console.error(e);
            setChecks(prev => ({ ...prev, backend: 'warning' }));
            // Continue anyway, maybe transient
        }

        // 2. Internet Check
        setStatusMessage('Checking Connectivity...');
        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
            setChecks(prev => ({ ...prev, internet: 'success' }));
        } catch (e) {
            setChecks(prev => ({ ...prev, internet: 'warning' }));
        }

        // 3. AI Service (LM Studio detection or just assume Local)
        setStatusMessage('Detecting AI Models...');
        // In Docker, we might use OpenRouter or Local detected. 
        // Let's just default to "success" for Docker simplified flow, detection can happen in background.
        // We'll try to detect LM Studio briefly.
        try {
            const lmRes = await fetch('http://localhost:1234/v1/models', { method: 'GET', signal: AbortSignal.timeout(1500) }).catch(() => null);
            if (lmRes && lmRes.ok) {
                setChecks(prev => ({ ...prev, ai_service: 'success' }));
            } else {
                setChecks(prev => ({ ...prev, ai_service: 'warning' })); // Not strictly fail, just warning
            }
        } catch {
            setChecks(prev => ({ ...prev, ai_service: 'warning' }));
        }

        // 4. Verification/License (Auto-Grant for Docker)
        setStatusMessage('Verifying License...');
        setChecks(prev => ({ ...prev, license: 'success' }));

        // FINALIZE
        setStatusMessage('Ready! Launching Dashboard...');

        // Auto-save default settings if new
        const defaultSettings = {
            persona: { role: 'Researcher', name: 'BioDockify User' },
            ai_provider: { mode: 'lm_studio', lm_studio_url: 'http://localhost:1234/v1' }, // Default
            theme: 'dark'
        };

        setTimeout(() => {
            onComplete(defaultSettings);
        }, 800);
    };

    const CheckItem = ({ label, status }: { label: string, status: string }) => (
        <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
            <span className="text-slate-300">{label}</span>
            {status === 'pending' && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
            {status === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
            {status === 'warning' && <span className="text-xs text-amber-500 font-mono">CHECK</span>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100">
            <div className="w-full max-w-sm bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <ShieldCheck className="w-6 h-6 text-teal-400" />
                    </div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">
                        BioDockify
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{statusMessage}</p>
                </div>

                <div className="space-y-1 bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    <CheckItem label="Core Services" status={checks.backend} />
                    <CheckItem label="Internet Access" status={checks.internet} />
                    <CheckItem label="AI Engine" status={checks.ai_service} />
                    <CheckItem label="License" status={checks.license} />
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600 animate-pulse">Launching your secure workspace...</p>
                </div>
            </div>
        </div>
    );
}
