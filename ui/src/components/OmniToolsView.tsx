import React, { useState } from 'react';
import { Hammer, FileText, Image as ImageIcon, Download, Upload, ArrowRight, Loader2, CheckCircle, FileJson, Type, List as ListIcon, Hash, Film, ChevronLeft, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ToolCategory = 'pdf' | 'image' | 'json' | 'text' | 'list' | 'number';
type ToolMode = 'pdf-merge' | 'image-convert' | 'json-prettify' | 'json-csv' | 'placeholder';

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
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-900/10"
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

    // Workspace State
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [params, setParams] = useState<any>({}); // Generic params (format, operation)

    const launchTool = (mode: ToolMode) => {
        setActiveMode(mode);
        setView('workspace');
        setFiles([]);
        setResultBlob(null);
        // Set defaults
        if (mode === 'image-convert') setParams({ format: 'png' });
        if (mode === 'json-csv') setParams({ operation: 'to_csv' });
        if (mode === 'json-prettify') setParams({ operation: 'to_json' });
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
                toast.success("Image Converted Successfully!");
            } else if (activeMode === 'json-csv' || activeMode === 'json-prettify') {
                formData.append('file', files[0]);
                formData.append('operation', params.operation);
                const blob = await api.tools.processData(formData);
                setResultBlob(blob);
                toast.success("Data Processed Successfully!");
            } else {
                toast.info("This tool is a placeholder in the demo.");
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
        if (activeMode === 'pdf-merge') filename = 'merged.pdf';
        if (activeMode === 'image-convert') filename = `converted.${params.format}`;
        if (activeMode === 'json-csv') filename = 'converted.csv';
        if (activeMode === 'json-prettify') filename = 'prettified.json';

        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // --- DASHBOARD VIEW ---
    if (view === 'dashboard') {
        return (
            <div className="h-full bg-slate-50 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8 space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900">OmniTools Suite</h1>
                        <p className="text-slate-500">Secure, client-side utilities for your daily workflow.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

                        {/* 1. PDF Tools (Custom Addition for BioDockify) */}
                        <ToolCard
                            icon={FileText}
                            title="PDF Tools"
                            description="Merge multiple PDFs into one, split documents, or extract text from research papers."
                            color="bg-red-100 text-red-600"
                            primaryLabel="See all PDF Tools"
                            secondaryLabel="Try Merge PDF"
                            onPrimary={() => launchTool('pdf-merge')}
                            onSecondary={() => launchTool('pdf-merge')}
                        />

                        {/* 2. PNG Tools (Image) */}
                        <ToolCard
                            icon={ImageIcon}
                            title="Image Tools"
                            description="Tools for working with images – convert PNGs to JPGs, resize, and optimize for publications."
                            color="bg-green-100 text-green-600"
                            primaryLabel="See all Image Tools"
                            secondaryLabel="Try Convert Image"
                            onPrimary={() => launchTool('image-convert')}
                            onSecondary={() => launchTool('image-convert')}
                        />

                        {/* 3. JSON Tools */}
                        <ToolCard
                            icon={FileJson}
                            title="Json Tools"
                            description="Tools for working with JSON data structures – prettify, minify, and convert to CSV for analysis."
                            color="bg-yellow-100 text-yellow-600"
                            primaryLabel="See all Json Tools"
                            secondaryLabel="Try Json to CSV"
                            onPrimary={() => launchTool('json-prettify')}
                            onSecondary={() => launchTool('json-csv')}
                        />

                        {/* 4. Text Tools */}
                        <ToolCard
                            icon={Type}
                            title="Text Tools"
                            description="Tools for working with text – find and replace, split text, and analyze readability."
                            color="bg-blue-100 text-blue-600"
                            primaryLabel="See all Text Tools"
                            secondaryLabel="Try Text Analysis"
                            onPrimary={() => launchTool('placeholder')}
                            onSecondary={() => launchTool('placeholder')}
                        />

                        {/* 5. List Tools */}
                        <ToolCard
                            icon={ListIcon}
                            title="List Tools"
                            description="Tools for working with lists – sort, reverse, randomize, and deduplicate gene lists."
                            color="bg-purple-100 text-purple-600"
                            primaryLabel="See all List Tools"
                            secondaryLabel="Try Sort List"
                            onPrimary={() => launchTool('placeholder')}
                            onSecondary={() => launchTool('placeholder')}
                        />

                        {/* 6. Number Tools */}
                        <ToolCard
                            icon={Hash}
                            title="Number Tools"
                            description="Tools for working with numbers – statistics, unit conversion, and sequence generation."
                            color="bg-cyan-100 text-cyan-600"
                            primaryLabel="See all Number Tools"
                            secondaryLabel="Try Calculator"
                            onPrimary={() => launchTool('placeholder')}
                            onSecondary={() => launchTool('placeholder')}
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
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {activeMode === 'pdf-merge' && <FileText className="w-5 h-5 text-red-400" />}
                            {activeMode === 'image-convert' && <ImageIcon className="w-5 h-5 text-green-400" />}
                            {(activeMode === 'json-prettify' || activeMode === 'json-csv') && <FileJson className="w-5 h-5 text-yellow-400" />}

                            <span className="capitalize">{activeMode.replace('-', ' ')}</span>
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
                            <Hammer className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">Coming Soon</h3>
                            <p className="text-slate-500 mt-2">This native tool is currently under development.</p>
                            <button onClick={() => setView('dashboard')} className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg">Return to Dashboard</button>
                        </div>
                    ) : (
                        <div className="space-y-8 relative z-10">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">Upload Files</h3>
                                <p className="text-slate-400 text-sm">Select files to process securely on your device.</p>
                            </div>

                            {/* File Dropper */}
                            <div className="relative group">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    multiple={activeMode === 'pdf-merge'}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                <div className="border-2 border-dashed border-slate-700 group-hover:border-blue-500/50 rounded-xl p-10 transition-all bg-slate-950/50 group-hover:bg-slate-900 text-center">
                                    {files.length > 0 ? (
                                        <div className="space-y-2">
                                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                                            <p className="font-mono text-sm text-green-400">{files.length} file(s) selected</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="w-12 h-12 text-slate-600 mx-auto group-hover:text-blue-400 transition-colors" />
                                            <p className="text-slate-400">Drag files or click to browse</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Options */}
                            {activeMode === 'image-convert' && (
                                <div className="flex justify-center gap-2">
                                    {['png', 'jpeg', 'webp'].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setParams({ ...params, format: fmt })}
                                            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors ${params.format === fmt ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
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
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:grayscale"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        {processing ? 'Processing...' : 'Run Tool'}
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

                    {/* Background decoration */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                </div>
            </div>
        </div>
    );
}

