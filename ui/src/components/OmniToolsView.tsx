import React, { useState } from 'react';
import { Hammer, FileText, Image as ImageIcon, Download, Upload, ArrowRight, Loader2, CheckCircle, FileJson, Type, List as ListIcon, Hash, ShieldCheck, Database, BookOpen, PenTool } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ToolCategory = 'pdf' | 'image' | 'data' | 'text' | 'ref' | 'audit';
type ToolMode = 'pdf-merge' | 'image-convert' | 'json-csv' | 'placeholder';

interface ToolCardProps {
    icon: any;
    title: string;
    description: string;
    color: string;
    onPrimary: () => void;
    onSecondary: () => void;
    primaryLabel: string;
    secondaryLabel: string;
}

const ToolCard = ({ icon: Icon, title, description, color, onPrimary, onSecondary, primaryLabel, secondaryLabel }: ToolCardProps) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group h-full">
        <div className="p-6 flex-1">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {description}
            </p>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button
                onClick={onPrimary}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-teal-900/10"
            >
                {primaryLabel}
            </button>
            <button
                onClick={onSecondary}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg transition-colors"
            >
                {secondaryLabel}
            </button>
        </div>
    </div>
);

export default function OmniToolsView() {
    const [view, setView] = useState<'dashboard' | 'workspace'>('dashboard');
    const [activeMode, setActiveMode] = useState<ToolMode>('pdf-merge');
    const [activeTitle, setActiveTitle] = useState('Tool');

    // Workspace State
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [params, setParams] = useState<any>({});

    // License Guard (Includes GDrive if added later)
    // License Guard - Unlocked for everyone
    const isLicenseActive = true;

    if (!isLicenseActive) {
        return (
            <div className="h-full flex items-center justify-center p-12 bg-slate-50">
                <div className="text-center space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-lg">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Research Utilities Locked</h2>
                    <p className="text-slate-500">
                        Advanced PDF tools and GDrive integrations require a verified account.
                    </p>
                </div>
            </div>
        );
    }

    const launchTool = (mode: ToolMode, title: string) => {
        setActiveMode(mode);
        setActiveTitle(title);
        setView('workspace');
        setFiles([]);
        setResultBlob(null);
        if (mode === 'image-convert') setParams({ format: 'png' });
        if (mode === 'json-csv') setParams({ operation: 'to_csv' });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setResultBlob(null);
        }
    };

    const executeTool = async () => {
        if (files.length === 0) return;
        setProcessing(true);
        setResultBlob(null);

        try {
            const formData = new FormData();

            if (activeMode === 'pdf-merge') {
                files.forEach(f => formData.append('files', f));
                const blob = await api.tools.mergePDFs(formData);
                setResultBlob(blob);
                toast.success("PDFs Merged Successfully!");
            } else if (activeMode === 'image-convert') {
                formData.append('file', files[0]);
                formData.append('format', params.format || 'png');
                const blob = await api.tools.convertImage(formData);
                setResultBlob(blob);
                toast.success("Figure Processed Successfully!");
            } else if (activeMode === 'json-csv') {
                formData.append('file', files[0]);
                formData.append('operation', params.operation);
                const blob = await api.tools.processData(formData);
                setResultBlob(blob);
                toast.success("Dataset Converted Successfully!");
            } else {
                toast.info("This academic utility is in development.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Operation Failed");
        } finally {
            setProcessing(false);
        }
    };

    const downloadResult = () => {
        if (!resultBlob) return;
        const url = window.URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        let filename = 'result';
        if (activeMode === 'pdf-merge') filename = 'merged_research.pdf';
        if (activeMode === 'image-convert') filename = `figure.${params.format}`;
        if (activeMode === 'json-csv') filename = 'data.csv';
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // --- DASHBOARD VIEW ---
    if (view === 'dashboard') {
        return (
            <div className="h-full bg-slate-50 overflow-y-auto font-sans">
                <div className="max-w-7xl mx-auto p-12 space-y-12">
                    {/* Header */}
                    <div className="space-y-4 border-b border-slate-200 pb-8">
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Pharma Research Utilities</h1>
                        <p className="text-lg text-slate-500 max-w-3xl leading-relaxed">
                            Offline-first academic toolkit for manuscript preparation, data integrity, and compliance.
                            <br /><span className="text-sm font-semibold text-teal-600 uppercase tracking-widest mt-2 block">Part of BioDockify Academic Suite</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                        {/* A. TEXT & WRITING */}
                        <ToolCard
                            icon={Type}
                            title="Text & Writing Tools"
                            description="Clean whitespace, normalize case, format paragraphs, and prepare text for manuscripts."
                            color="bg-slate-100 text-slate-700"
                            primaryLabel="Clean Text"
                            secondaryLabel="Format Case"
                            onPrimary={() => launchTool('placeholder', 'Text Cleaner')}
                            onSecondary={() => launchTool('placeholder', 'Case Converter')}
                        />

                        {/* B. REFERENCE & CITATION */}
                        <ToolCard
                            icon={BookOpen}
                            title="Reference & Citation"
                            description="Deduplicate references, validate BibTeX/RIS, and convert lists to CSV for 200+ citation reviews."
                            color="bg-blue-100 text-blue-700"
                            primaryLabel="Deduplicate Refs"
                            secondaryLabel="Convert List"
                            onPrimary={() => launchTool('placeholder', 'Ref Deduplicator')}
                            onSecondary={() => launchTool('placeholder', 'List to CSV')}
                        />

                        {/* C. RESEARCH PDF UTILITIES */}
                        <ToolCard
                            icon={FileText}
                            title="Research PDF Utilities"
                            description="Merge supplementary files, split articles, or extract text for screening."
                            color="bg-red-100 text-red-700"
                            primaryLabel="Merge PDFs"
                            secondaryLabel="Split PDF"
                            onPrimary={() => launchTool('pdf-merge', 'Merge PDFs')}
                            onSecondary={() => launchTool('pdf-merge', 'Split PDF')} // Reusing merge for demo flow
                        />

                        {/* D. SCIENTIFIC FIGURE UTILITIES */}
                        <ToolCard
                            icon={ImageIcon}
                            title="Scientific Figure Utilities"
                            description="Strict Journal Compliance: Resize, Compress, DPI Adjust, and Format Conversion (No filters)."
                            color="bg-green-100 text-green-700"
                            primaryLabel="Convert Format"
                            secondaryLabel="Adjust DPI"
                            onPrimary={() => launchTool('image-convert', 'Figure Converter')}
                            onSecondary={() => launchTool('image-convert', 'DPI Adjuster')}
                        />

                        {/* E. RESEARCH DATA TOOLS */}
                        <ToolCard
                            icon={Database}
                            title="Research Data Tools"
                            description="Convert JSON/XML to CSV for analysis. Handle screening tables and results datasets."
                            color="bg-yellow-100 text-yellow-700"
                            primaryLabel="JSON to CSV"
                            secondaryLabel="XML to CSV"
                            onPrimary={() => launchTool('json-csv', 'JSON Converter')}
                            onSecondary={() => launchTool('json-csv', 'XML Converter')}
                        />

                        {/* F. INTEGRITY & AUDIT */}
                        <ToolCard
                            icon={ShieldCheck}
                            title="Integrity & Audit Tools"
                            description="Verify file checksums (SHA-256) and ensure data reproducibility for examiners."
                            color="bg-purple-100 text-purple-700"
                            primaryLabel="Verify Checksum"
                            secondaryLabel="File Hash"
                            onPrimary={() => launchTool('placeholder', 'Checksum Verifier')}
                            onSecondary={() => launchTool('placeholder', 'File Hasher')}
                        />

                    </div>
                </div>
            </div>
        );
    }

    // --- WORKSPACE VIEW ---
    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center space-x-4">
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors group">
                        <ArrowRight className="w-5 h-5 text-slate-400 rotate-180 group-hover:text-white" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Hammer className="w-5 h-5 text-teal-500" />
                            <span className="capitalize">{activeTitle}</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* Workspace Content */}
            <div className="flex-1 p-12 flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    {/* Placeholder Mode */}
                    {activeMode === 'placeholder' ? (
                        <div className="text-center py-12">
                            <PenTool className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">Utility In Development</h3>
                            <p className="text-slate-500 mt-2">This academic compliance tool will be available in the upcoming update.</p>
                            <button onClick={() => setView('dashboard')} className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Return to Utilities</button>
                        </div>
                    ) : (
                        <div className="space-y-8 relative z-10">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">Upload Source Files</h3>
                                <p className="text-slate-400 text-sm">Processed locally. No data leaves your workstation.</p>
                            </div>

                            {/* File Dropper */}
                            <div className="relative group">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    multiple={activeMode === 'pdf-merge'}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                <div className="border-2 border-dashed border-slate-700 group-hover:border-teal-500/50 rounded-xl p-10 transition-all bg-slate-950/50 group-hover:bg-slate-900 text-center">
                                    {files.length > 0 ? (
                                        <div className="space-y-2">
                                            <CheckCircle className="w-12 h-12 text-teal-500 mx-auto" />
                                            <p className="font-mono text-sm text-teal-400">{files.length} file(s) ready</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="w-12 h-12 text-slate-600 mx-auto group-hover:text-teal-400 transition-colors" />
                                            <p className="text-slate-400">Drag files or click to browse</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Options */}
                            {activeMode === 'image-convert' && (
                                <div className="flex justify-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-2 mr-2">Target Format:</span>
                                    {['png', 'jpeg', 'webp', 'tiff'].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setParams({ ...params, format: fmt })}
                                            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${params.format === fmt ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Action Area */}
                            <div className="flex justify-center pt-4">
                                {!resultBlob ? (
                                    <button
                                        onClick={executeTool}
                                        disabled={files.length === 0 || processing}
                                        className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-900/20 disabled:opacity-50 disabled:grayscale"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        {processing ? 'Processing...' : 'Run Utility'}
                                    </button>
                                ) : (
                                    <div className="flex gap-4 animate-in slide-in-from-bottom-2">
                                        <button
                                            onClick={() => { setFiles([]); setResultBlob(null); }}
                                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={downloadResult}
                                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download Result
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
