import React from 'react';
import { Globe, ArrowRight, BookOpen, GraduationCap, Microscope } from 'lucide-react';
import { PenTool } from 'lucide-react';
// Note: PenTool might duplicate if imported above, ensuring imports are clean.
// Actually let's clean up imports.

interface AcademicWriterHubProps {
    onSelectMode: (mode: 'thesis_writer' | 'review_writer' | 'research_writer') => void;
}

export const AcademicWriterHub: React.FC<AcademicWriterHubProps> = ({ onSelectMode }) => {
    return (
        <div className="h-full bg-slate-950 text-slate-200 overflow-y-auto p-12 flex flex-col items-center font-sans">

            <header className="text-center mb-16 max-w-2xl">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-teal-900/20">
                    <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Academic Writer Suite</h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                    Select a high-compliance writing engine aligned with international standards (Scopus/SCI/PubMed).
                    Agent Zero will act as your strict methodological co-author.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl w-full">

                {/* 1. PhD Thesis */}
                <div
                    onClick={() => onSelectMode('thesis_writer')}
                    className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 transition-all cursor-pointer hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                    <div className="mb-6 w-12 h-12 bg-blue-950/50 rounded-lg flex items-center justify-center border border-blue-900/30 group-hover:bg-blue-900/50">
                        <BookOpen className="w-6 h-6 text-blue-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-white">PhD Thesis Compiler</h2>
                    <p className="text-sm font-mono text-blue-400 mb-4">MODE: STRICT COMPLIANCE</p>

                    <ul className="text-slate-400 text-sm space-y-3 mb-8 flex-1">
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-blue-500 rounded-full" />
                            Builds a 7-Chapter Doctoral Thesis
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-blue-500 rounded-full" />
                            Enforces traceability & proof validation
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-blue-500 rounded-full" />
                            Includes full-screen Chapter Manager
                        </li>
                    </ul>

                    <button className="w-full py-3 rounded-lg bg-slate-800 text-slate-300 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                        Open Compiler <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* 2. Review Article */}
                <div
                    onClick={() => onSelectMode('review_writer')}
                    className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-8 transition-all cursor-pointer hover:shadow-2xl hover:shadow-purple-900/10 flex flex-col"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                    <div className="mb-6 w-12 h-12 bg-purple-950/50 rounded-lg flex items-center justify-center border border-purple-900/30 group-hover:bg-purple-900/50">
                        <Globe className="w-6 h-6 text-purple-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-white">Intl. Review Author</h2>
                    <p className="text-sm font-mono text-purple-400 mb-4">MODE: HIGH IMPACT</p>

                    <ul className="text-slate-400 text-sm space-y-3 mb-8 flex-1">
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-purple-500 rounded-full" />
                            Write 20+ page Systematic Reviews
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-purple-500 rounded-full" />
                            Automated citation auditing (200+ refs)
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-purple-500 rounded-full" />
                            Scopus/SCI Journal Standard
                        </li>
                    </ul>

                    <button className="w-full py-3 rounded-lg bg-slate-800 text-slate-300 font-semibold group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                        Start Review <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* 3. Original Research */}
                <div
                    onClick={() => onSelectMode('research_writer')}
                    className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-8 transition-all cursor-pointer hover:shadow-2xl hover:shadow-teal-900/10 flex flex-col"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                    <div className="mb-6 w-12 h-12 bg-teal-950/50 rounded-lg flex items-center justify-center border border-teal-900/30 group-hover:bg-teal-900/50">
                        <Microscope className="w-6 h-6 text-teal-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-white">Original Research</h2>
                    <p className="text-sm font-mono text-teal-400 mb-4">MODE: EVIDENTIARY</p>

                    <ul className="text-slate-400 text-sm space-y-3 mb-8 flex-1">
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-teal-500 rounded-full" />
                            Structure Novel Research (IMRaD)
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-teal-500 rounded-full" />
                            Validates Methods vs Results
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-teal-500 rounded-full" />
                            Ensures Reproducibility & Ethics
                        </li>
                    </ul>

                    <button className="w-full py-3 rounded-lg bg-slate-800 text-slate-300 font-semibold group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                        Draft Article <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    );
};
