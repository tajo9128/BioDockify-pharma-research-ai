import React, { useState } from 'react';
import { Settings } from '@/lib/api'; // Using base type, will augment locally
import { ArrowRight, Check, Shield, User, BookOpen, AlertTriangle } from 'lucide-react';

interface WizardProps {
    onComplete: (settings: any) => void;
}

export default function FirstRunWizard({ onComplete }: WizardProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        role: 'PhD Student',
        purpose: 'Thesis Preparation',
        strictness: 'conservative',
        citation_lock: true
    });

    const nextStep = () => setStep(step + 1);

    const finish = () => {
        // Transform form data into settings structure
        const settingsUpdate = {
            persona: {
                role: formData.role,
                primary_purpose: [formData.purpose],
                strictness: formData.strictness
            },
            pharma: {
                citation_threshold: formData.citation_lock ? 'high' : 'medium'
            }
        };
        onComplete(settingsUpdate);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Progress Bar */}
                <div className="h-1 bg-slate-800 w-full">
                    <div
                        className="h-full bg-teal-500 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8 flex-1">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
                                <User className="w-6 h-6 text-teal-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Who are you?</h2>
                            <p className="text-slate-400 text-lg">
                                BioDockify adapts its reasoning engine to match your expertise level.
                            </p>

                            <div className="grid gap-4 mt-6">
                                {['PhD Student', 'Senior Researcher', 'Industry Scientist', 'Clinician'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setFormData({ ...formData, role })}
                                        className={`text-left p-4 rounded-xl border transition-all ${formData.role === role
                                                ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-500/10'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-lg">{role}</span>
                                            {formData.role === role && <Check className="w-5 h-5 text-teal-400" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">What is your goal?</h2>
                            <p className="text-slate-400 text-lg">
                                This helps the agent prioritize discovery vs. validation.
                            </p>

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
                                <div>
                                    <h4 className="text-white font-medium">Strictness Level</h4>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Based on "Thesis Preparation", we recommend <strong>Standard Reasoning</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Safety Protocols</h2>
                            <p className="text-slate-400 text-lg">
                                Enforce generic safety rails for your research.
                            </p>

                            <div className="space-y-4 mt-6">
                                <div
                                    className={`p-6 rounded-xl border transition-all cursor-pointer flex items-start space-x-4 ${formData.citation_lock
                                            ? 'bg-emerald-500/10 border-emerald-500'
                                            : 'bg-slate-950 border-slate-800 opacity-60'
                                        }`}
                                    onClick={() => setFormData({ ...formData, citation_lock: !formData.citation_lock })}
                                >
                                    <div className={`w-6 h-6 rounded border flex items-center justify-center mt-1 ${formData.citation_lock ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                                        {formData.citation_lock && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
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
                        Step {step} of 3
                    </div>
                    <button
                        onClick={step === 3 ? finish : nextStep}
                        className="flex items-center space-x-2 bg-white text-slate-950 hover:bg-slate-200 px-8 py-3 rounded-xl font-bold text-lg transition-colors"
                    >
                        <span>{step === 3 ? 'Start Researching' : 'Next'}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
