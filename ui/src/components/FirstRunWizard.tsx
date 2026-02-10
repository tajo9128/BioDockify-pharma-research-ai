
import React, { useState, useEffect } from 'react';
import {
    Check, Loader2, Wifi, Server, Brain,
    ShieldCheck, User, FolderPlus, Rocket,
    ArrowRight, ChevronLeft, Sparkles
} from 'lucide-react';
import ConnectivityHealer from './wizard/ConnectivityHealer';

interface StartupProps {
    onComplete: (settings: any) => void;
}

type WizardStep = 'connectivity' | 'persona' | 'project' | 'launching';

export default function FirstRunWizard({ onComplete }: StartupProps) {
    const [step, setStep] = useState<WizardStep>('connectivity');
    const [persona, setPersona] = useState({
        name: '',
        role: 'Researcher'
    });
    const [project, setProject] = useState({
        title: '',
        type: 'research'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnectivityComplete = (result: any) => {
        setStep('persona');
    };

    const handlePersonaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!persona.name.trim()) return;
        setStep('project');
    };

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project.title.trim()) return;

        setIsSubmitting(true);
        setError(null);
        setStep('launching');

        try {
            // 1. Save Settings
            const settings = {
                persona,
                theme: 'dark',
                ai_provider: { mode: 'lm_studio', lm_studio_url: 'http://localhost:1234/v1' }
            };

            // Save to localStorage for quick restore
            localStorage.setItem('biodockify_user_name', persona.name);
            localStorage.setItem('biodockify_first_run_complete', 'true');

            // 2. Create Initial Project on Backend
            const res = await fetch('/api/enhanced/project' +
                `?project_title=${encodeURIComponent(project.title)}` +
                `&project_type=${encodeURIComponent(project.type)}`, {
                method: 'POST'
            });

            if (!res.ok) throw new Error('Failed to create project');

            const result = await res.json();
            console.log('Project created:', result);

            // 3. Finalize
            setTimeout(() => {
                onComplete(settings);
            }, 1000);

        } catch (err: any) {
            console.error('Wizard submission failed:', err);
            setError(err.message || 'An error occurred during setup');
            setStep('project'); // Go back to fix
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100 overflow-y-auto p-4">
            <div className="w-full max-w-xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Progress Bar */}
                <div className="h-1 bg-slate-800 w-full">
                    <div
                        className="h-full bg-teal-500 transition-all duration-500"
                        style={{
                            width:
                                step === 'connectivity' ? '25%' :
                                    step === 'persona' ? '50%' :
                                        step === 'project' ? '75%' : '100%'
                        }}
                    />
                </div>

                <div className="p-8">
                    {step === 'connectivity' && (
                        <div className="space-y-6">
                            <ConnectivityHealer
                                onComplete={handleConnectivityComplete}
                                onSkip={() => setStep('persona')}
                            />
                        </div>
                    )}

                    {step === 'persona' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Who are you?</h2>
                                <p className="text-slate-400 text-sm mt-1">Tell us a bit about yourself to personalize your workspace.</p>
                            </div>

                            <form onSubmit={handlePersonaSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 pl-1">Name / Identifier</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        value={persona.name}
                                        onChange={e => setPersona(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Dr. Richards"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none transition-all placeholder:text-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 pl-1">Professional Role</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Researcher', 'Student', 'Lab Tech', 'Clinician'].map(role => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setPersona(prev => ({ ...prev, role }))}
                                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${persona.role === role
                                                    ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!persona.name.trim()}
                                    className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center space-x-2 mt-4"
                                >
                                    <span>Continue</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'project' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FolderPlus className="w-6 h-6 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">First Project</h2>
                                <p className="text-slate-400 text-sm mt-1">Let&apos;s create your first workspace to get started.</p>
                            </div>

                            <form onSubmit={handleProjectSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center">
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 pl-1">Research Project Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        value={project.title}
                                        onChange={e => setProject(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. mRNA Vaccine Stability Analysis"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none transition-all placeholder:text-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 pl-1">Project Template</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'research', label: 'Deep Research', desc: 'Focus on literature and knowledge synthesis' },
                                            { id: 'lab_experiment', label: 'Lab Simulation', desc: 'Experiment design and data analysis' },
                                            { id: 'clinical_trial', label: 'Clinical Study', desc: 'Patient data and trial monitoring' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setProject(prev => ({ ...prev, type: t.id }))}
                                                className={`p-3 rounded-xl border text-left transition-all ${project.type === t.id
                                                    ? 'bg-teal-500/10 border-teal-500'
                                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className="font-bold text-white text-sm">{t.label}</div>
                                                <div className="text-slate-500 text-xs">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep('persona')}
                                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!project.title.trim() || isSubmitting}
                                        className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Initialize Workspace</span>
                                                <Rocket className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 'launching' && (
                        <div className="py-12 text-center space-y-6 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-10 h-10 text-teal-400 animate-pulse" />
                                </div>
                                <Loader2 className="w-24 h-24 text-teal-500/20 animate-spin absolute top-1/2 left-1/2 -mt-12 -ml-12" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Deploying Infrastructure...</h2>
                                <p className="text-slate-400">BioDockify is configuring your secure research environment.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
