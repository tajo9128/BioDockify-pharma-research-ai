import React from 'react';
import { FlaskConical, PenTool, Brain, Search, Database, Clock, ArrowRight, Zap, Target } from 'lucide-react';

interface HomeProps {
    onNavigate: (view: string) => void;
}

export default function HomeDashboard({ onNavigate }: HomeProps) {
    return (
        <div className="h-full overflow-y-auto p-8 bg-slate-950">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome Back, Researcher</h1>
                <p className="text-slate-400 text-lg">BioDockify v2.14.5 is ready. What shall we discover today?</p>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
