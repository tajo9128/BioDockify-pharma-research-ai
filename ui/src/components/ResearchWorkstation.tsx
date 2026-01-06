import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Search, PenTool, Layout, Play, Pause, Square, AlertCircle, FileText, Globe, Cpu, ChevronRight, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Types (Micro-definitions to be self-contained)
type WorkMode = 'search' | 'synthesize' | 'write';
interface LogEntry { id: string; type: 'info' | 'thought' | 'result'; content: string; timestamp: Date; }
interface Evidence { id: string; title: string; score: number; year: number; }

export default function ResearchWorkstation() {
    // State
    const [mode, setMode] = useState<WorkMode>('search');
    const [query, setQuery] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [evidence, setEvidence] = useState<Evidence[]>([]);

    // Auto-scroll logic
    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

    // Handlers
    const startResearch = async () => {
        if (!query.trim()) return;
        setIsRunning(true);
        addLog('info', `Starting research task: "${query}" in MODE: ${mode.toUpperCase()}`);

        try {
            // Mocking the stream for UI demonstration
            // In production, this would be a WebSocket or SSE connection
            const taskId = await api.startTask(query, mode);
            addLog('thought', 'Initializing Intent Engine...');

            // Simulation of async events
            setTimeout(() => addLog('thought', 'Querying Semantic Scholar for high-impact papers...'), 1500);
            setTimeout(() => addLog('thought', 'Running PubTator entity normalization...'), 3000);
            setTimeout(() => {
                addLog('result', 'Found 12 relevant papers. Top result: "Amyloid-beta and Alzheimer\'s" (Inf Score: 85)');
                setEvidence(prev => [...prev, { id: '1', title: 'Amyloid-beta and Alzheimer\'s', score: 85, year: 2023 }]);
            }, 4500);

        } catch (e: any) {
            addLog('info', `Error: ${e.message}`);
            setIsRunning(false);
        }
    };

    const addLog = (type: LogEntry['type'], content: string) => {
        setLogs(prev => [...prev, { id: Date.now().toString(), type, content, timestamp: new Date() }]);
    };

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">

            {/* Header */}
            <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur">
                <div className="flex items-center space-x-3">
                    <Layout className="w-5 h-5 text-teal-400" />
                    <span className="font-bold text-white tracking-wide">BioDockify <span className="text-slate-600 font-normal">Workstation</span></span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className={`flex items-center text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 ${isRunning ? 'text-green-400 animate-pulse' : 'text-slate-500'}`}>
                        <Cpu className="w-3 h-3 mr-2" />
                        {isRunning ? 'AGENT ACTIVE' : 'IDLE'}
                    </span>
                    <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Maximize2 className="w-4 h-4" /></button>
                </div>
            </header>

            {/* Main Layout (3 Columns) */}
            <div className="flex-1 flex overflow-hidden">

                {/* COL 1: CONTROL PANEL */}
                <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col">
                    <div className="p-6 space-y-6">

                        {/* Mode Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Operation Mode</label>
                            <div className="grid grid-cols-1 gap-2">
                                <ModeBtn id="search" label="Discovery" icon={Search} active={mode === 'search'} onClick={() => setMode('search')} />
                                <ModeBtn id="synthesize" label="Synthesis" icon={FileText} active={mode === 'synthesize'} onClick={() => setMode('synthesize')} />
                                <ModeBtn id="write" label="Drafting" icon={PenTool} active={mode === 'write'} onClick={() => setMode('write')} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="flex-1 flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Research Goal</label>
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Describe your research objective..."
                                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white resize-none focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={startResearch}
                                disabled={isRunning || !query}
                                className="col-span-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-teal-900/20"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>START</span>
                            </button>
                            <button
                                disabled={!isRunning}
                                className="bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </button>
                        </div>

                    </div>

                    {/* Status Footer */}
                    <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900/50">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Pharma Pipeline:</span>
                            <span className="text-green-400 font-bold">READY</span>
                        </div>
                    </div>
                </div>

                {/* COL 2: STREAM (Reasoning Engine) */}
                <div className="flex-1 border-r border-slate-800 bg-slate-950 flex flex-col relative">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-300">Reasoning Stream</h2>
                        <button className="text-xs text-teal-400 hover:underline">Export Logs</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                        {logs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                                <Cpu className="w-16 h-16 opacity-20" />
                                <p>Agent is awaiting instructions...</p>
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-start space-x-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'thought' ? 'bg-purple-500' :
                                            log.type === 'result' ? 'bg-green-500' : 'bg-slate-500'
                                        }`} />
                                    <div className="space-y-1">
                                        <span className="text-xs text-slate-500 font-mono uppercase">{log.type} &middot; {log.timestamp.toLocaleTimeString()}</span>
                                        <div className={`text-sm leading-relaxed ${log.type === 'thought' ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                                            <ReactMarkdown>{log.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>

                {/* COL 3: KNOWLEDGE GRAPH (Evidence) */}
                <div className="w-96 bg-slate-950 flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
                        <h2 className="text-sm font-bold text-slate-300">Live Evidence</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {evidence.length === 0 ? (
                            <div className="text-center py-12 text-slate-600 text-sm">
                                No evidence collected yet.
                            </div>
                        ) : (
                            evidence.map((ev) => (
                                <div key={ev.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group cursor-pointer">
                                    <h4 className="text-sm font-medium text-blue-400 group-hover:underline line-clamp-2">{ev.title}</h4>
                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                        <span>{ev.year}</span>
                                        <span className="flex items-center text-teal-500 font-mono">
                                            Inf: {ev.score}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

const ModeBtn = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3 rounded-lg transition-all border ${active
                ? 'bg-teal-500/10 border-teal-500/50 text-white'
                : 'bg-slate-900 border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
    >
        <div className={`p-2 rounded-md mr-3 ${active ? 'bg-teal-500 text-black' : 'bg-slate-800'}`}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="text-left">
            <span className={`block text-sm font-bold ${active ? 'text-teal-400' : 'text-slate-400'}`}>{label}</span>
        </div>
        {active && <ChevronRight className="w-4 h-4 ml-auto text-teal-500" />}
    </button>
);
