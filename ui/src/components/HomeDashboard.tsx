import React, { useEffect, useState } from 'react';
import { FlaskConical, PenTool, Brain, Search, Database, Clock, ArrowRight, Zap, Target } from 'lucide-react';
import api from '@/lib/api';

interface HomeProps {
    onNavigate: (view: string) => void;
}

export default function HomeDashboard({ onNavigate }: HomeProps) {
    const [userName, setUserName] = useState<string>('Researcher');
    const [loading, setLoading] = useState(true);
    const [licenseActive, setLicenseActive] = useState<boolean>(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Check License First
                const isLicenseActive = localStorage.getItem('biodockify_license_active') === 'true';
                setLicenseActive(isLicenseActive);

                if (!isLicenseActive) {
                    setLoading(false);
                    return; // Don't fetch settings if locked
                }

                // Try to get cached name first for speed
                const localName = localStorage.getItem('biodockify_user_name');
                if (localName) setUserName(localName);

                const settings = await api.getSettings();
                if (settings && settings.persona && settings.persona.name) {
                    setUserName(settings.persona.name);
                    // Cache it
                    localStorage.setItem('biodockify_user_name', settings.persona.name);
                }
            } catch (e) {
                console.error('Failed to load user settings:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    if (!loading && !licenseActive) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-950 p-8">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                        <div className="w-10 h-10 text-slate-500">
                            {/* Lock Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">License Verification Required</h1>
                        <p className="text-slate-400 mt-2">The free version of BioDockify requires a one-time verification to unlock the research workspace.</p>
                    </div>
                    <button
                        onClick={() => onNavigate('settings')}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal-500/10"
                    >
                        Go to Settings to Unlock
                    </button>
                    <p className="text-xs text-slate-600">
                        Configured during setup? Trying restarting the app to refresh your license.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-8 bg-slate-950">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome Back, {userName}</h1>
                <p className="text-slate-400 text-lg">BioDockify v2.17.4 is ready. What shall we discover today?</p>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Main Action 1 */}
                    <button
                        onClick={() => onNavigate('research')}
                        className="group relative p-6 bg-gradient-to-br from-teal-900/30 to-slate-900 border border-teal-500/20 rounded-2xl hover:border-teal-500/50 transition-all text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FlaskConical className="w-6 h-6 text-teal-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Start Research</h3>
                        <p className="text-sm text-slate-400">Launch the research workstation to analyze targets and synthesize data.</p>
                    </button>

                    {/* Main Action 2 */}
                    <button
                        onClick={() => onNavigate('writers')}
                        className="group relative p-6 bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/50 transition-all text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <PenTool className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Academic Suite</h3>
                        <p className="text-sm text-slate-400">Draft thesis chapters, review papers, and manage citations.</p>
                    </button>

                    {/* Main Action 3 */}
                    <button
                        onClick={() => onNavigate('autonomous')}
                        className="group relative p-6 bg-gradient-to-br from-purple-900/30 to-slate-900 border border-purple-500/20 rounded-2xl hover:border-purple-500/50 transition-all text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Brain className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Deep Research</h3>
                        <p className="text-sm text-slate-400">Initiate autonomous deep-dive investigations into complex topics.</p>
                    </button>

                    {/* Main Action 4 (External) */}
                    <button
                        onClick={() => window.open('https://www.biodockify.com', '_blank')}
                        className="group relative p-6 bg-gradient-to-br from-cyan-900/30 to-slate-900 border border-cyan-500/20 rounded-2xl hover:border-cyan-500/50 transition-all text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FlaskConical className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Virtual Lab</h3>
                        <p className="text-sm text-slate-400">Access the full cloud-based Virtual Lab environment.</p>
                    </button>
                </div>

                {/* Status & Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-amber-400" /> System Status
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-300">Local AI Engine</span>
                                <span className="text-emerald-400 flex items-center text-xs font-mono bg-emerald-400/10 px-2 py-1 rounded">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                                    ONLINE
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-300">Document Processor</span>
                                <span className="text-emerald-400 flex items-center text-xs font-mono bg-emerald-400/10 px-2 py-1 rounded">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                                    READY
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-sky-400" /> Recent Activity
                        </h3>
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3">
                                <Search className="w-5 h-5 text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-sm">No recent activity found.</p>
                            <button onClick={() => onNavigate('research')} className="mt-2 text-sky-400 hover:text-sky-300 text-sm font-medium">Start a new project</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
