import React, { useState } from 'react';
import { api } from '@/lib/api';
import { ShieldCheck, AlertTriangle, ShieldAlert, BookOpen, Search, CheckCircle2, XCircle, Globe, Link } from 'lucide-react';

export default function JournalChecker() {
    const [title, setTitle] = useState('');
    const [issn, setIssn] = useState('');
    const [url, setUrl] = useState('');

    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        if (!title || !issn) {
            setError("Title and ISSN are required.");
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await api.verifyJournal({ title, issn, url: url || undefined });
            setResult(res);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (decision: string) => {
        switch (decision) {
            case 'VERIFIED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50';
            case 'SUSPICIOUS': return 'bg-amber-500/10 text-amber-400 border-amber-500/50';
            case 'HIGH_RISK': return 'bg-red-500/10 text-red-400 border-red-500/50';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    const getStatusIcon = (decision: string) => {
        switch (decision) {
            case 'VERIFIED': return <ShieldCheck className="w-12 h-12 text-emerald-400" />;
            case 'SUSPICIOUS': return <AlertTriangle className="w-12 h-12 text-amber-400" />;
            case 'HIGH_RISK': return <ShieldAlert className="w-12 h-12 text-red-500" />;
            default: return <ShieldCheck className="w-12 h-12 text-slate-600" />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-100 p-8 overflow-hidden">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-indigo-500" />
                    Journal Authenticity System
                </h1>
                <p className="text-slate-400 mt-2 max-w-2xl">
                    Advanced 6-Pillar verification to detect predatory, hijacked, and cloned journals.
                    Prioritizes safety and authoritative data.
                </p>
            </div>

            <div className="flex gap-8 h-full overflow-hidden">
                {/* Input Column */}
                <div className="w-1/3 flex flex-col gap-6 animate-in fade-in slide-in-from-left-4">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
                        <h2 className="text-lg font-medium text-white flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            Identify Journal
                        </h2>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">Journal Title <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="e.g. Nature"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">ISSN (Print or Elec) <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono placeholder:text-slate-600"
                                placeholder="XXXX-XXXX"
                                value={issn}
                                onChange={(e) => setIssn(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">Journal URL (Optional)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="https://..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">Providing a URL enables anti-clone protection.</p>
                        </div>

                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 mt-2"
                        >
                            {loading ? 'Verifying Integrity...' : 'Verify Authenticity'}
                        </button>

                        {error && (
                            <p className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">{error}</p>
                        )}
                    </div>

                    <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800/50">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Coverage</h3>
                        <ul className="text-xs text-slate-500 space-y-1">
                            <li>• Web of Science Core (SCIE/SSCI)</li>
                            <li>• Scopus Source List</li>
                            <li>• Retraction Watch Hijack List</li>
                        </ul>
                    </div>
                </div>

                {/* Results Column */}
                <div className="flex-1 overflow-y-auto pr-2 animate-in fade-in slide-in-from-right-4">
                    {!result && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                            <ShieldCheck className="w-24 h-24 mb-4" />
                            <p className="text-lg">Waiting for verification request...</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6">
                            {/* Decision Card */}
                            <div className={`p-8 rounded-2xl border ${getStatusColor(result.decision)} flex items-center justify-between shadow-2xl`}>
                                <div>
                                    <h3 className="text-sm uppercase tracking-widest opacity-80 font-bold mb-1">Verification Result</h3>
                                    <h2 className="text-4xl font-bold tracking-tight">{result.decision.replace('_', ' ')}</h2>
                                    <p className="mt-2 text-sm opacity-90 max-w-md">
                                        Confidence Level: <b>{result.confidence_level}</b>
                                    </p>
                                </div>
                                <div className="bg-black/20 p-4 rounded-full backdrop-blur-sm">
                                    {getStatusIcon(result.decision)}
                                </div>
                            </div>

                            {/* Canonical Identity */}
                            {result.canonical_identity && (
                                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Canonical Record
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                        <div>
                                            <label className="text-slate-500 text-xs uppercase">Official Title</label>
                                            <p className="text-white font-medium">{result.canonical_identity.title}</p>
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs uppercase">Publisher</label>
                                            <p className="text-white font-medium">{result.canonical_identity.publisher}</p>
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs uppercase">Canonical ISSN</label>
                                            <p className="text-white font-mono">{result.canonical_identity.issn}</p>
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs uppercase">Country</label>
                                            <p className="text-white font-medium">{result.canonical_identity.country}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pillars Breakdown */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Validation Pillars</h3>
                                {result.pillars.map((pillar: any, i: number) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-start gap-4 transition-all hover:bg-slate-800/50">
                                        <div className={`mt-1 rounded-full p-1 bg-black/40 border ${pillar.status === 'PASS' ? 'border-emerald-500 text-emerald-500' :
                                                pillar.status === 'FAIL' ? 'border-red-500 text-red-500' :
                                                    pillar.status === 'CAUTION' ? 'border-amber-500 text-amber-500' :
                                                        'border-slate-600 text-slate-600'
                                            }`}>
                                            {pillar.status === 'PASS' ? <CheckCircle2 className="w-4 h-4" /> :
                                                pillar.status === 'FAIL' ? <XCircle className="w-4 h-4" /> :
                                                    pillar.status === 'CAUTION' ? <AlertTriangle className="w-4 h-4" /> :
                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-semibold text-sm ${pillar.status === 'PASS' ? 'text-emerald-300' :
                                                        pillar.status === 'FAIL' ? 'text-red-300' :
                                                            pillar.status === 'CAUTION' ? 'text-amber-300' :
                                                                'text-slate-400'
                                                    }`}>{pillar.name}</h4>
                                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">{pillar.status}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">{pillar.details}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Risk Factors */}
                            {result.risk_factors.length > 0 && (
                                <div className="bg-red-950/10 border border-red-900/30 rounded-lg p-5">
                                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" /> Risk Factors Detected
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                                        {result.risk_factors.map((risk: string, i: number) => (
                                            <li key={i}>{risk}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="text-xs text-slate-600 text-right pt-4 border-t border-slate-900">
                                Engine Version: {result.engine_version} | Timestamp: {new Date(result.timestamp).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
