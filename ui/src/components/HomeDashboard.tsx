import React, { useEffect, useState } from 'react';
import { FlaskConical, PenTool, Brain, Search, Database, Clock, ArrowRight, Zap, Target, Bot } from 'lucide-react';
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

    const RestrictedCard = ({ onClick, children, id }: { onClick: () => void, children: React.ReactNode, id: string }) => {
        // License check removed - Free for everyone
        const isLocked = false;

        return (
            <button
                onClick={onClick}
                className="group relative p-6 bg-gradient-to-br from-opacity-20 to-slate-900 border border-opacity-20 hover:border-opacity-50 from-slate-900 border-slate-800 rounded-2xl transition-all text-left overflow-hidden hover:border-slate-600"
            >
                {children}
            </button>
        );
    };

    return (
        <div className="h-full overflow-y-auto p-8 bg-slate-950">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome Back, {userName}</h1>
                <p className="text-slate-400 text-lg">BioDockify v2.3.9 Research Workstation. What shall we discover today?</p>

            </div>

            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Main Action 1 - Agent Zero Chat */}
                    <RestrictedCard id="agent-chat" onClick={() => onNavigate('agent-chat')}>
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Bot className="w-6 h-6 text-teal-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">BioDockify AI Chat</h3>
                        <p className="text-sm text-slate-400">Your AI research partner. Ask questions, plan experiments, and analyze data.</p>
                    </RestrictedCard>

                    {/* Main Action 2 - BioDockify AI Workstation */}
                    <RestrictedCard id="research" onClick={() => onNavigate('research')}>
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FlaskConical className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">BioDockify AI Workstation</h3>
                        <p className="text-sm text-slate-400">Advanced molecular analysis and simulation tools.</p>
                    </RestrictedCard>

                    {/* Main Action 3 - Academic Suite */}
                    <RestrictedCard id="writers" onClick={() => onNavigate('writers')}>
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <PenTool className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Academic Writer</h3>
                        <p className="text-sm text-slate-400">Draft thesis chapters and review papers with AI assistance.</p>
                    </RestrictedCard>

                    {/* Main Action 4 (External) - ALWAYS UNLOCKED */}
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
