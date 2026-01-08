```javascript
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ArrowRight, Check, Shield, User, BookOpen, AlertTriangle, Database, Brain, Server, XCircle, RefreshCcw, Wifi } from 'lucide-react';

interface WizardProps {
    onComplete: (settings: any) => void;
}

export default function FirstRunWizard({ onComplete }: WizardProps) {
    const [step, setStep] = useState(0); // 0: System Check, 1: Role, 2: Goal, 3: Safety
    
    // System Check State
    const [ollamaConfig, setOllamaConfig] = useState({ url: 'http://localhost:11434', status: 'pending', msg: '' });
    const [neo4jConfig, setNeo4jConfig] = useState({ uri: 'bolt://localhost:7687', user: 'neo4j', pass: 'password', status: 'pending', msg: '' });
    const [checking, setChecking] = useState(false);

    // Persona State
    const [formData, setFormData] = useState({
        role: 'PhD Student',
        purpose: 'Thesis Preparation',
        strictness: 'conservative',
        citation_lock: true
    });

    const checkSystem = async () => {
        setChecking(true);
        // Check Ollama
        try {
            const res = await api.checkOllama(ollamaConfig.url);
            setOllamaConfig(prev => ({ ...prev, status: res.status === 'success' ? 'success' : 'error', msg: res.message || 'Connected' }));
        } catch (e: any) {
            setOllamaConfig(prev => ({ ...prev, status: 'error', msg: e.message }));
        }

        // Check Neo4j
        try {
            const res = await api.checkNeo4j(neo4jConfig.uri, neo4jConfig.user, neo4jConfig.pass);
            setNeo4jConfig(prev => ({ ...prev, status: res.status === 'success' ? 'success' : 'error', msg: res.message || 'Connected' }));
        } catch (e: any) {
            setNeo4jConfig(prev => ({ ...prev, status: 'error', msg: e.message }));
        }
        setChecking(false);
    };

    // Auto-check on mount
    useEffect(() => { checkSystem(); }, []);

    const nextStep = () => setStep(step + 1);

    const finish = () => {
        const settingsUpdate = {
            persona: {
                role: formData.role,
                primary_purpose: [formData.purpose],
                strictness: formData.strictness
            },
            pharma: {
                citation_threshold: formData.citation_lock ? 'high' : 'medium'
            },
            ai_provider: {
                ollama_url: ollamaConfig.url,
                // We don't save Neo4j explicitly in Settings JSON typically, it's env var or system level, 
                // but if we supported saving it, we would here. 
                // For now we assume User configures Env or we save to local storage if needed. 
                // We'll update settings object anyway.
            }
        };
        onComplete(settingsUpdate);
    };

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'success') return <Check className="w-5 h-5 text-emerald-400" />;
        if (status === 'error') return <XCircle className="w-5 h-5 text-rose-500" />;
        return <RefreshCcw className="w-5 h-5 text-slate-500 animate-spin" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                            <Database className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">BioDockify System Setup</h1>
                            <p className="text-xs text-slate-400">Initial Configuration Wizard</p>
                        </div>
                    </div>
                    {/* Progress Dots */}
                    <div className="flex space-x-2">
                         {[0, 1, 2, 3].map(i => (
                             <div key={i} className={`w - 2 h - 2 rounded - full transition - all ${ step === i ? 'bg-teal-500 w-6' : step > i ? 'bg-teal-500/40' : 'bg-slate-800' } `} />
                         ))}
                    </div>
                </div>

                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* STEP 0: SYSTEM HEALTH */}
                    {step === 0 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-2xl font-bold text-white">Connect Your Infrastructure</h2>
                                <p className="text-slate-400">BioDockify orchestrates local AI and Graph Database engines.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Ollama Card */}
                                <div className={`p - 6 rounded - xl border ${ ollamaConfig.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800' } `}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <Brain className="w-6 h-6 text-sky-400" />
                                            <h3 className="font-bold text-white">Ollama (LLM)</h3>
                                        </div>
                                        <StatusIcon status={checking ? 'pending' : ollamaConfig.status} />
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-mono uppercase">Base URL</label>
                                            <input 
                                                value={ollamaConfig.url} 
                                                onChange={(e) => setOllamaConfig({ ...ollamaConfig, url: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono"
                                            />
                                        </div>
                                        {ollamaConfig.msg && <p className={`text - xs ${ ollamaConfig.status === 'success' ? 'text-emerald-400' : 'text-rose-400' } `}>{ollamaConfig.msg}</p>}
                                    </div>
                                </div>

                                {/* Neo4j Card */}
                                <div className={`p - 6 rounded - xl border ${ neo4jConfig.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800' } `}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <Database className="w-6 h-6 text-indigo-400" />
                                            <h3 className="font-bold text-white">Neo4j (Knowledge Graph)</h3>
                                        </div>
                                        <StatusIcon status={checking ? 'pending' : neo4jConfig.status} />
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-mono uppercase">Bolt URI</label>
                                            <input 
                                                value={neo4jConfig.uri} 
                                                onChange={(e) => setNeo4jConfig({ ...neo4jConfig, uri: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-slate-500 font-mono uppercase">User</label>
                                                <input 
                                                    value={neo4jConfig.user} 
                                                    onChange={(e) => setNeo4jConfig({ ...neo4jConfig, user: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-mono uppercase">Password</label>
                                                <input 
                                                    type="password"
                                                    value={neo4jConfig.pass} 
                                                    onChange={(e) => setNeo4jConfig({ ...neo4jConfig, pass: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono"
                                                />
                                            </div>
                                        </div>
                                        {neo4jConfig.msg && <p className={`text - xs ${ neo4jConfig.status === 'success' ? 'text-emerald-400' : 'text-rose-400' } `}>{neo4jConfig.msg}</p>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-center pt-4">
                                <button 
                                    onClick={checkSystem}
                                    disabled={checking}
                                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-slate-700"
                                >
                                    <RefreshCcw className={`w - 4 h - 4 ${ checking ? 'animate-spin' : '' } `} />
                                    <span>Test Connections</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: PERSONA (Existing) */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                             <div className="text-center space-y-2 mb-8">
                                <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-6 h-6 text-teal-400" />
                                }
                                <h2 className="text-2xl font-bold text-white">Who are you?</h2>
                                <p className="text-slate-400">BioDockify adapts its reasoning engine to match your expertise level.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['PhD Student', 'Senior Researcher', 'Industry Scientist', 'Clinician'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setFormData({ ...formData, role })}
                                        className={`text - left p - 4 rounded - xl border transition - all ${
    formData.role === role
    ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-500/10'
    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
} `}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">{role}</span>
                                            {formData.role === role && <Check className="w-5 h-5 text-teal-400" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: GOAL (Existing) */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                             <div className="text-center space-y-2 mb-8">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-6 h-6 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">What is your goal?</h2>
                                <p className="text-slate-400">This helps the agent prioritize discovery vs. validation.</p>
                            </div>

                            <select
                                value={formData.purpose}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-lg mt-4 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option>Thesis Preparation</option>
                                <option>Drug Repurposing Discovery</option>
                                <option>Systematic Literature Review</option>
                                <option>Safety & Toxicity Analysis</option>
                                <option>Grant Proposal Writing</option>
                            </select>

                            <div className="mt-8 p-4 bg-slate-950/50 rounded-lg border border-slate-800 flex items-start space-x-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                                <div className="text-left">
                                    <h4 className="text-white font-medium">Strictness Level</h4>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Based on "Thesis Preparation", we recommend <strong>Standard Reasoning</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SAFETY (Existing) */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                             <div className="text-center space-y-2 mb-8">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Safety Protocols</h2>
                                <p className="text-slate-400">Enforce generic safety rails for your research.</p>
                            </div>

                            <div className="space-y-4 max-w-lg mx-auto">
                                <div
                                    className={`p - 6 rounded - xl border transition - all cursor - pointer flex items - start space - x - 4 ${
    formData.citation_lock
    ? 'bg-emerald-500/10 border-emerald-500'
    : 'bg-slate-950 border-slate-800 opacity-60'
} `}
                                    onClick={() => setFormData({ ...formData, citation_lock: !formData.citation_lock })}
                                >
                                    <div className={`w - 6 h - 6 rounded border flex items - center justify - center mt - 1 ${ formData.citation_lock ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600' } `}>
                                        {formData.citation_lock && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold text-white">Citation Lock</h3>
                                        <p className="text-slate-400 mt-1">
                                            Block the agent from generating any text unless it is backed by at least 3 high-quality citations.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                        {step === 0 ? "Initial Setup" : `Step ${ step } of 3`}
                    </div>
                    <button
                        onClick={step === 3 ? finish : nextStep}
                        className={`flex items - center space - x - 2 bg - white text - slate - 950 hover: bg - slate - 200 px - 8 py - 3 rounded - xl font - bold text - lg transition - colors ${ step === 0 && (ollamaConfig.status !== 'success' || neo4jConfig.status !== 'success') ? "opacity-75" : "" } `}
                    >
                        <span>{step === 3 ? 'Start Researching' : 'Next'}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
