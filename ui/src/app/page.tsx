'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Cpu,
  Settings,
  Activity,
  Download,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Microscope,
  Network
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

// --- Types ---
type ResearchMode = 'search' | 'synthesize' | 'write' | 'protocol';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface ResearchStats {
  papersAnalyzed: number;
  candidatesFound: number;
  protocolsGenerated: number;
  graphNodes: number;
}

// --- Main Component ---
export default function PharmaceuticalResearchApp() {
  // State
  const [activeView, setActiveView] = useState<'home' | 'console' | 'settings'>('home');
  const [researchMode, setResearchMode] = useState<ResearchMode>('search');
  const [topic, setTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ResearchStats>({
    papersAnalyzed: 0,
    candidatesFound: 0,
    protocolsGenerated: 0,
    graphNodes: 0
  });

  // Console Auto-scroll
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Logging Helper
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, entry]);
  };

  // Actions
  const handleStartResearch = async () => {
    if (!topic.trim()) return;

    setIsResearching(true);
    addLog(`Starting ${researchMode} research on: "${topic}"`, 'info');

    try {
      // API call simulation for immediate feedback
      // In real app: await api.startTask({ mode: researchMode, topic });
      setTimeout(() => {
        addLog('Initializing Agent Zero...', 'info');
      }, 500);

      setTimeout(() => {
        addLog('Searching PubMed and OpenAlex...', 'info');
        setStats(prev => ({ ...prev, papersAnalyzed: prev.papersAnalyzed + 5 }));
      }, 1500);

      // Keep it simple for this verified build
    } catch (error) {
      addLog('Failed to start research task', 'error');
      setIsResearching(false);
    }
  };

  const handleStopResearch = () => {
    setIsResearching(false);
    addLog('Research task stopped by user', 'warning');
  };

  // --- Render Helpers ---
  const renderStatCard = (label: string, value: number, Icon: any, color: string) => (
    <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />

      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} onViewChange={(view: any) => setActiveView(view)} />

      {/* Main Content Area */}
      <main className="ml-20 p-8 min-h-screen relative z-0">

        {/* VIEW: HOME */}
        {activeView === 'home' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                BioDockify AI
              </h1>
              <p className="text-slate-400 text-lg">
                Pharmaceutical Intelligence & Knowledge Synthesis Platform via Agentic AI
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderStatCard('Papers Analyzed', stats.papersAnalyzed, BookOpen, 'text-blue-400')}
              {renderStatCard('Candidates', stats.candidatesFound, Microscope, 'text-teal-400')}
              {renderStatCard('Graph Nodes', stats.graphNodes, Network, 'text-purple-400')}
              {renderStatCard('Protocols', stats.protocolsGenerated, FileText, 'text-orange-400')}
            </div>

            {/* Research Input Panel */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-2xl">
              <div className="flex items-center space-x-4 mb-6">
                <button
                  onClick={() => setResearchMode('search')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${researchMode === 'search' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/50' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Literature Search
                </button>
                <button
                  onClick={() => setResearchMode('synthesize')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${researchMode === 'synthesize' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/50' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Cpu className="w-4 h-4 inline mr-2" />
                  Synthesis
                </button>
                <button
                  onClick={() => setResearchMode('write')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${researchMode === 'write' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/50' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Drafting
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Describe your research goal (e.g., 'Find novel inhibitors for Tau aggregation in Alzheimer\'s disease')..."
                  className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none placeholder-slate-600 transition-all"
                />
                <div className="absolute bottom-4 right-4 flex space-x-3">
                  {isResearching ? (
                    <button
                      onClick={handleStopResearch}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-2 rounded-lg font-medium border border-red-500/50 flex items-center transition-all"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={handleStartResearch}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-2 rounded-lg font-bold flex items-center shadow-lg shadow-teal-500/20 transition-all transform hover:scale-105"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Research
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Console Preview */}
            <div className="bg-black/50 rounded-xl border border-slate-800 p-4 font-mono text-sm h-48 overflow-y-auto custom-scrollbar">
              <div className="text-slate-500 mb-2 sticky top-0 bg-black/90 p-1 border-b border-slate-800 flex justify-between">
                <span>SYSTEM LOGS</span>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-500 text-xs">ONLINE</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {logs.length === 0 && (
                  <div className="text-slate-600 italic">No activity logs recorded yet...</div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start">
                    <span className="text-slate-600 w-24 shrink-0">[{log.timestamp}]</span>
                    <span className={`
                      ${log.type === 'info' ? 'text-blue-300' : ''}
                      ${log.type === 'success' ? 'text-green-400' : ''}
                      ${log.type === 'error' ? 'text-red-400' : ''}
                      ${log.type === 'warning' ? 'text-yellow-400' : ''}
                    `}>
                      {log.type === 'success' && '✓ '}
                      {log.type === 'error' && '✗ '}
                      {log.type === 'warning' && '⚠ '}
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            </div>

          </div>
        )}

        {/* VIEW: CONSOLE (Expanded) */}
        {activeView === 'console' && (
          <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] bg-black rounded-2xl border border-slate-800 p-6 flex flex-col font-mono">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <h2 className="text-xl text-slate-200 font-bold flex items-center">
                <Activity className="w-6 h-6 mr-3 text-teal-500" />
                Terminal Output
              </h2>
              <div className="flex space-x-2">
                <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-white px-3 py-1 border border-slate-800 rounded">
                  CLEAR
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className="border-b border-slate-900/50 pb-1">
                  <span className="text-slate-500 mr-4">[{log.timestamp}]</span>
                  <span className={`
                        ${log.type === 'info' ? 'text-slate-300' : ''}
                        ${log.type === 'success' ? 'text-green-400' : ''}
                        ${log.type === 'error' ? 'text-red-500 font-bold' : ''}
                        ${log.type === 'warning' ? 'text-yellow-500' : ''}
                      `}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {activeView === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">System Settings</h2>
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
              <p className="text-slate-400">Settings configuration loaded from <code>config_loader.py</code></p>
              {/* Placeholder for standard settings UI */}
              <div className="mt-6 flex items-center space-x-4">
                <div className="w-full h-12 bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
