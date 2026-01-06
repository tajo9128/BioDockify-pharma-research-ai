'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Console, { ConsoleLog } from '@/components/Console';
import StatusBadge from '@/components/StatusBadge';
import ProgressStep from '@/components/ProgressStep';
import StatsCard from '@/components/StatsCard';
import { api, ResearchStatus, ResearchResults, Settings } from '@/lib/api';
import {
  Search, Database, FileText, Download, Zap, CheckCircle2, Play,
  X, ArrowRight, RefreshCw, TestTube, Settings as SettingsIcon,
  FileOutput, Sparkles, TrendingUp, Network, Atom, Microscope,
  Beaker, Calendar, Clock, Globe, Award, Target, Lightbulb,
  ChevronRight, Star, Rocket, ChevronDown, PenTool, BookOpen,
  MessageSquare, Brain, Lock, Shield
} from 'lucide-react';

export default function PharmaceuticalResearchApp() {
  const [activeView, setActiveView] = useState('home');
  const [researchTopic, setResearchTopic] = useState('');
  const [researchMode, setResearchMode] = useState<'search' | 'synthesize' | 'write'>('synthesize');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResults | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [recentResearches, setRecentResearches] = useState<any[]>([]);
  const [recentExports, setRecentExports] = useState<any[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [showExplainWhy, setShowExplainWhy] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    project: {
      name: 'My PhD Research',
      type: 'PhD Thesis',
      disease_context: "Alzheimer's Disease",
      stage: 'Literature Review'
    },
    agent: {
      mode: 'semi-autonomous',
      reasoning_depth: 'standard',
      self_correction: true,
      max_retries: 3,
      failure_policy: 'ask_user'
    },
    literature: {
      sources: ['pubmed', 'europe_pmc'],
      year_range: 10,
      novelty_strictness: 'medium'
    },
    ai_provider: {
      mode: 'free_api',
      openai_key: '',
      elsevier_key: '',
      pubmed_email: ''
    },
    database: { host: 'bolt://localhost:7687', user: 'neo4j', password: 'password' },
  });
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'success' | 'error' | 'testing' }>({});
  const [protocolType, setProtocolType] = useState<'liquid-handler' | 'crystallization' | 'assay'>('liquid-handler');
  const [reportTemplate, setReportTemplate] = useState<'full' | 'summary' | 'executive'>('full');

  // Poll research status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (currentTaskId && isPolling) {
      pollInterval = setInterval(async () => {
        try {
          const status = await api.getStatus(currentTaskId);
          setResearchStatus(status);
          setConsoleLogs(status.logs.map((log, idx) => ({
            id: `${idx}-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            message: log,
          })));

          if (status.status === 'completed' || status.status === 'failed') {
            setIsPolling(false);
            if (status.status === 'completed') {
              const results = await api.getResults(currentTaskId);
              setResearchResults(results);
              setActiveView('results');
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentTaskId, isPolling]);

  // Load initial data
  useEffect(() => {
    loadSettings();
    loadRecentResearches();
    loadRecentExports();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await api.getSettings();
      setSettings(config);
    } catch (error) {
      console.error('Error loading settings:', error);
      addConsoleLog('Failed to load configuration', 'error');
    }
  };

  const loadRecentResearches = async () => {
    try {
      const history = await api.getResearchHistory();
      setRecentResearches(history.slice(0, 5));
    } catch (error) {
      console.error('Error loading research history:', error);
    }
  };

  const loadRecentExports = async () => {
    try {
      const exports = await api.getRecentExports();
      setRecentExports(exports.slice(0, 5));
    } catch (error) {
      console.error('Error loading exports:', error);
    }
  };

  const startResearch = async () => {
    if (!researchTopic.trim()) return;

    try {
      const { taskId } = await api.startResearch(researchTopic, researchMode);
      setCurrentTaskId(taskId);
      setIsPolling(true);
      setActiveView('research');
      addConsoleLog('Starting research task...', 'info');
    } catch (error) {
      console.error('Error starting research:', error);
      addConsoleLog('Failed to start research', 'error');
    }
  };

  const cancelResearch = async () => {
    if (!currentTaskId) return;

    try {
      await api.cancelResearch(currentTaskId);
      setIsPolling(false);
      addConsoleLog('Research cancelled', 'warning');
    } catch (error) {
      console.error('Error cancelling research:', error);
    }
  };

  const addConsoleLog = (message: string, type?: ConsoleLog['type']) => {
    const newLog: ConsoleLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setConsoleLogs(prev => [...prev, newLog]);
  };

  const testConnection = async (type: 'llm' | 'database' | 'elsevier') => {
    setConnectionStatus(prev => ({ ...prev, [type]: 'testing' }));
    try {
      await api.testConnection(type);
      setConnectionStatus(prev => ({ ...prev, [type]: 'success' }));
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  const saveSettings = async () => {
    try {
      await api.saveSettings(settings);
      addConsoleLog('Settings saved successfully', 'success');
    } catch (error) {
      addConsoleLog('Failed to save settings', 'error');
    }
  };

  const generateProtocol = async () => {
    if (!currentTaskId) return;
    try {
      await api.generateProtocol({ taskId: currentTaskId, type: protocolType });
      addConsoleLog(`Generated ${protocolType} protocol`, 'success');
      loadRecentExports();
    } catch (error) {
      addConsoleLog('Failed to generate protocol', 'error');
    }
  };

  const generateReport = async () => {
    if (!currentTaskId) return;
    try {
      await api.generateReport({ taskId: currentTaskId, template: reportTemplate });
      addConsoleLog(`Generated ${reportTemplate} report`, 'success');
      loadRecentExports();
    } catch (error) {
      addConsoleLog('Failed to generate report', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-orbs relative">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="ml-20 p-8 relative z-10">
        {activeView === 'home' && (
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            {/* Perplexity-Like Main Research Panel */}
            <div className="max-w-4xl mx-auto mb-16 relative pt-10">
              {/* Branding */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Agent Zero Engine</span>
                </div>
                <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                  What will you <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">discover</span> today?
                </h1>
                <p className="text-gray-400 text-lg">
                  {settings.user_persona?.role ? `Welcome back, ${settings.user_persona.role.replace('_', ' ')}.` : 'Autonomous pharmaceutical research assistant.'}
                </p>
              </div>

              {/* Main Input Card */}
              <div className="glass-card p-1 rounded-2xl shadow-2xl shadow-black/50 border-white/10 relative z-20 group transition-all duration-300 focus-within:ring-2 ring-teal-500/30">
                {/* Input Area */}
                <div className="relative bg-[#0A0C10]/80 backdrop-blur-xl rounded-xl p-4">
                  <textarea
                    value={researchTopic}
                    onChange={(e) => setResearchTopic(e.target.value)}
                    placeholder="Ask a research question or describe a hypothesis..."
                    className="w-full bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none resize-none h-20 scrolling-auto"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startResearch();
                      }
                    }}
                  />

                  {/* Controls Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    {/* Mode Toggles */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                      <button
                        onClick={() => setResearchMode('search')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${researchMode === 'search'
                          ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                          }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Search
                      </button>
                      <button
                        onClick={() => setResearchMode('synthesize')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${researchMode === 'synthesize'
                          ? 'bg-purple-500/20 text-purple-400 shadow-sm'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                          }`}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        Synthesize
                      </button>
                      <button
                        onClick={() => setResearchMode('write')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${researchMode === 'write'
                          ? 'bg-teal-500/20 text-teal-400 shadow-sm'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                          }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Write
                      </button>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-3">
                      {/* Strictness Indicator (Read-only view from settings) */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-400" title="Scientific Strictness">
                        <Shield className="w-3 h-3" />
                        <span className="capitalize">{settings.user_persona?.strictness || 'Balanced'}</span>
                      </div>

                      <button
                        onClick={startResearch}
                        disabled={!researchTopic.trim()}
                        className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 text-black flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions / Hints */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={() => setResearchTopic("Identify contradictions in recent Alzheimer's amyloid theories")} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors">
                  Explore contradictions
                </button>
                <button onClick={() => setResearchTopic("Synthesize novel drug targets for Triple-Negative Breast Cancer")} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors">
                  Find novel targets
                </button>
                <button onClick={() => setResearchTopic("Draft a review on CRISPR delivery mechanisms")} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors">
                  Draft review chapter
                </button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* Card 1 */}
              <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B9FF0]/20 to-[#5B9FF0]/5 border border-[#5B9FF0]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-8 h-8 text-[#5B9FF0]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Literature Search</h3>
                <p className="text-gray-400 leading-relaxed">
                  Automated PubMed and Elsevier API integration for comprehensive literature review
                  across millions of scientific papers and journals.
                </p>
                <div className="mt-6 flex items-center text-[#5B9FF0] font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4A90E2]/20 to-[#4A90E2]/5 border border-[#4A90E2]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Network className="w-8 h-8 text-[#4A90E2]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Knowledge Graph</h3>
                <p className="text-gray-400 leading-relaxed">
                  Neo4j-powered knowledge extraction and relationship mapping to uncover
                  hidden connections between drugs, proteins, and diseases.
                </p>
                <div className="mt-6 flex items-center text-[#4A90E2] font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4AA]/20 to-[#00D4AA]/5 border border-[#00D4AA]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TestTube className="w-8 h-8 text-[#00D4AA]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Lab Integration</h3>
                <p className="text-gray-400 leading-relaxed">
                  SiLA 2 protocol generation for automated liquid handlers and
                  laboratory equipment, streamlining experimental workflows.
                </p>
                <div className="mt-6 flex items-center text-[#00D4AA] font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>

            {/* Recent Research Section */}
            {recentResearches.length > 0 && (
              <div className="glass-card p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Clock className="w-6 h-6 text-[#9B8BFF]" />
                    Recent Research
                  </h3>
                  <button className="text-sm text-gray-400 hover:text-white transition-colors">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {recentResearches.map((research) => (
                    <button
                      key={research.id}
                      onClick={() => {
                        setCurrentTaskId(research.id);
                        setActiveView('results');
                      }}
                      className="w-full text-left p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B8BFF]/20 to-[#9B8BFF]/5 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#9B8BFF]" />
                          </div>
                          <div>
                            <span className="text-white font-medium block">{research.topic}</span>
                            <span className="text-sm text-gray-500 block mt-1">
                              {new Date(research.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={research.status as any} size="sm" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'research' && (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Rocket className="w-6 h-6 text-teal-400" />
                  <h2 className="text-2xl font-bold text-white">Agent Zero is thinking...</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono text-teal-300">{currentTaskId}</span>
                  <span className="flex items-center gap-1.5"><Brain className="w-3 h-3 text-purple-400" /> Mode: <span className="text-gray-300 capitalize">{researchMode}</span></span>
                  <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-green-400" /> Strictness: <span className="text-gray-300 capitalize">{settings.user_persona?.strictness || 'Balanced'}</span></span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Confidence Meter (Mocked for UI visualization until backend connects) */}
                <div className="flex flex-col items-end mr-4">
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-teal-400 font-bold">High</span>
                  </div>
                </div>

                {researchStatus?.status === 'running' && (
                  <button
                    onClick={cancelResearch}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    Stop
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COL: Progress & Console */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress Card */}
                <div className="glass-card p-6 border-l-4 border-l-teal-500">
                  {/* Steps UI */}
                  <div className="flex items-center justify-between mb-6">
                    <ProgressStep step={1} currentStep={researchStatus?.currentStep || 0} totalSteps={4} label="Search" />
                    <div className="w-8 h-px bg-white/10" />
                    <ProgressStep step={2} currentStep={researchStatus?.currentStep || 0} totalSteps={4} label="Read" />
                    <div className="w-8 h-px bg-white/10" />
                    <ProgressStep step={3} currentStep={researchStatus?.currentStep || 0} totalSteps={4} label="Reason" />
                    <div className="w-8 h-px bg-white/10" />
                    <ProgressStep step={4} currentStep={researchStatus?.currentStep || 0} totalSteps={4} label="Write" isLast />
                  </div>

                  {/* Current Action Text */}
                  <div className="bg-black/20 rounded-lg p-4 font-mono text-sm text-gray-300 border border-white/5 flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    <div>
                      <span className="text-teal-400 font-bold block mb-1">CURRENTLY:</span>
                      {researchStatus?.phase || 'Initializing Agent Zero...'}
                    </div>
                  </div>
                </div>
                {/* End of Progress Card */}

                {/* Reasoning / Explain Why */}
                <div className="glass-card p-1 overflow-hidden">
                  <button
                    onClick={() => setShowExplainWhy(!showExplainWhy)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      Agent Thought Process
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{showExplainWhy ? 'Hide' : 'Show'} reasoning</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showExplainWhy ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {showExplainWhy && (
                    <div className="p-4 bg-black/40 border-t border-white/5 max-h-60 overflow-y-auto font-mono text-xs text-green-400/80 space-y-1">
                      {consoleLogs.map((log) => (
                        <div key={log.id} className="flex gap-2">
                          <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                          <span>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Follow Up Suggestions (Mocked for now) */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-left transition-all group">
                    <div className="flex items-center gap-2 mb-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                      <Lightbulb className="w-3 h-3" /> Suggestion
                    </div>
                    <p className="text-sm text-gray-300 group-hover:text-white">Check for contradictory reviews in 2024</p>
                  </button>
                  <button className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-left transition-all group">
                    <div className="flex items-center gap-2 mb-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                      <Network className="w-3 h-3" /> Related
                    </div>
                    <p className="text-sm text-gray-300 group-hover:text-white">Compare with alternative pathway inhibitors</p>
                  </button>
                </div>
              </div>

              {/* RIGHT COL: Evidence Panel */}
              <div className="space-y-4">
                <div className="glass-card p-6 h-full border-t-4 border-t-purple-500">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Sources & Evidence
                  </h3>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">12</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">Papers</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-white">2024</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Year</div>
                    </div>
                  </div>

                  {/* Source List (Placeholder for now) */}
                  <div className="space-y-3">
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 flex gap-3">
                      <div className="w-8 h-8 rounded bg-blue-900/20 flex items-center justify-center shrink-0 font-bold text-blue-400 text-xs">1</div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-300 line-clamp-1">Novel Alzheimer's Mechanisms...</h4>
                        <p className="text-xs text-gray-500">Nature Medicine • 2024</p>
                      </div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 flex gap-3">
                      <div className="w-8 h-8 rounded bg-blue-900/20 flex items-center justify-center shrink-0 font-bold text-blue-400 text-xs">2</div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-300 line-clamp-1">Amyloid-Beta reconsidered...</h4>
                        <p className="text-xs text-gray-500">Cell • 2023</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                      <span className="text-xs text-gray-500 italic">Processing {researchStatus?.currentStep === 1 ? 'sources...' : 'citations...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'results' && researchResults && (
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D4AA]/20 to-[#00D4AA]/5 border border-[#00D4AA]/30 flex items-center justify-center">
                  <Award className="w-7 h-7 text-[#00D4AA]" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Research Results</h2>
                  <p className="text-gray-400">{researchResults.title}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatsCard
                title="Papers Analyzed"
                value={researchResults.stats.papers}
                icon={<FileText className="w-5 h-5 text-[#5B9FF0]" />}
                description="Scientific publications reviewed"
                gradient="pink"
              />
              <StatsCard
                title="Entities Found"
                value={researchResults.stats.entities}
                icon={<Target className="w-5 h-5 text-[#4A90E2]" />}
                description="Key entities identified"
                gradient="blue"
              />
              <StatsCard
                title="Graph Nodes"
                value={researchResults.stats.nodes}
                icon={<Network className="w-5 h-5 text-[#9B8BFF]" />}
                description="Knowledge graph connections"
                gradient="purple"
              />
              <StatsCard
                title="Relationships"
                value={researchResults.stats.connections}
                icon={<ArrowRight className="w-5 h-5 text-[#00D4AA]" />}
                description="Entity relationships"
                gradient="green"
              />
            </div>

            {/* Entities Section */}
            <div className="space-y-6 mb-10">
              {/* Drugs */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#5B9FF0] to-[#9B8BFF]" />
                  <h3 className="text-2xl font-bold text-white">Drugs</h3>
                  <span className="px-3 py-1 bg-[#5B9FF0]/10 text-[#5B9FF0] rounded-full text-sm font-semibold">
                    {researchResults.entities.drugs.length} found
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {researchResults.entities.drugs.map((drug) => (
                    <span
                      key={drug}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#5B9FF0]/10 to-[#5B9FF0]/5 text-[#5B9FF0] border border-[#5B9FF0]/20 rounded-full text-sm font-medium hover:shadow-[0_0_20px_rgba(255,107,157,0.3)] transition-shadow"
                    >
                      {drug}
                    </span>
                  ))}
                </div>
              </div>

              {/* Diseases */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#FC8181] to-[#5B9FF0]" />
                  <h3 className="text-2xl font-bold text-white">Diseases</h3>
                  <span className="px-3 py-1 bg-[#FC8181]/10 text-[#FC8181] rounded-full text-sm font-semibold">
                    {researchResults.entities.diseases.length} found
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {researchResults.entities.diseases.map((disease) => (
                    <span
                      key={disease}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#FC8181]/10 to-[#FC8181]/5 text-[#FC8181] border border-[#FC8181]/20 rounded-full text-sm font-medium hover:shadow-[0_0_20px_rgba(252,129,129,0.3)] transition-shadow"
                    >
                      {disease}
                    </span>
                  ))}
                </div>
              </div>

              {/* Proteins */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#00D4AA] to-[#4A90E2]" />
                  <h3 className="text-2xl font-bold text-white">Proteins</h3>
                  <span className="px-3 py-1 bg-[#00D4AA]/10 text-[#00D4AA] rounded-full text-sm font-semibold">
                    {researchResults.entities.proteins.length} found
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {researchResults.entities.proteins.map((protein) => (
                    <span
                      key={protein}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#00D4AA]/10 to-[#00D4AA]/5 text-[#00D4AA] border border-[#00D4AA]/20 rounded-full text-sm font-medium hover:shadow-[0_0_20px_rgba(0,212,170,0.3)] transition-shadow"
                    >
                      {protein}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-8 mb-10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-[#F6AD55]" />
                Research Summary
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">{researchResults.summary}</p>
            </div>

            {/* Export Actions */}
            <div className="glass-card p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Export Results</h3>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => {
                    if (currentTaskId) generateReport();
                  }}
                  className="glow-button px-8 py-4 rounded-2xl text-white font-bold text-lg flex items-center gap-3"
                >
                  <FileOutput className="w-5 h-5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => {
                    if (currentTaskId) generateReport();
                  }}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg rounded-2xl flex items-center gap-3 transition-all hover:scale-105"
                >
                  <Download className="w-5 h-5" />
                  <span>Download DOCX</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'lab' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Beaker className="w-8 h-8 text-[#00D4AA]" />
                Lab Interface
              </h2>
              <p className="text-gray-400">Generate SiLA 2 protocols and research reports</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Protocol Generator */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B9FF0]/20 to-[#5B9FF0]/5 border border-[#5B9FF0]/30 flex items-center justify-center">
                    <TestTube className="w-7 h-7 text-[#5B9FF0]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Protocol Generator</h3>
                    <p className="text-sm text-gray-400">SiLA 2 XML protocols</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Protocol Type</label>
                    <select
                      value={protocolType}
                      onChange={(e) => setProtocolType(e.target.value as any)}
                      className="modern-input w-full appearance-none cursor-pointer"
                    >
                      <option value="liquid-handler">Liquid Handler</option>
                      <option value="crystallization">Crystallization</option>
                      <option value="assay">Assay Protocol</option>
                    </select>
                  </div>

                  <button
                    onClick={generateProtocol}
                    disabled={!currentTaskId}
                    className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${currentTaskId
                      ? 'glow-button text-white'
                      : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    <Zap className="w-5 h-5" />
                    <span>Generate Protocol</span>
                  </button>
                </div>
              </div>

              {/* Report Generator */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A90E2]/20 to-[#4A90E2]/5 border border-[#4A90E2]/30 flex items-center justify-center">
                    <FileOutput className="w-7 h-7 text-[#4A90E2]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Report Generator</h3>
                    <p className="text-sm text-gray-400">Formatted research reports</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Report Template</label>
                    <select
                      value={reportTemplate}
                      onChange={(e) => setReportTemplate(e.target.value as any)}
                      className="modern-input w-full appearance-none cursor-pointer"
                    >
                      <option value="full">Full Report</option>
                      <option value="summary">Summary Report</option>
                      <option value="executive">Executive Summary</option>
                    </select>
                  </div>

                  <button
                    onClick={generateReport}
                    disabled={!currentTaskId}
                    className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${currentTaskId
                      ? 'glow-button text-white'
                      : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Exports */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Download className="w-5 h-5 text-[#9B8BFF]" />
                Recent Exports
              </h3>
              {recentExports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No exports yet</p>
              ) : (
                <div className="space-y-3">
                  {recentExports.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B8BFF]/20 to-[#9B8BFF]/5 flex items-center justify-center">
                          <FileOutput className="w-5 h-5 text-[#9B8BFF]" />
                        </div>
                        <div>
                          <span className="text-white font-medium block">{exp.filename}</span>
                          <span className="text-sm text-gray-500 block mt-1">
                            {new Date(exp.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-[#4A90E2] cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <SettingsIcon className="w-8 h-8 text-[#9B8BFF]" />
                  Configuration Dashboard
                </h2>
                <p className="text-gray-400">Manage research context, AI behavior, and API connections</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    try {
                      await api.resetSettings();
                      loadSettings();
                      addConsoleLog('Settings reset to defaults', 'info');
                    } catch (e) { console.error(e); }
                  }}
                  className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold transition-all"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={saveSettings}
                  className="glow-button px-8 py-3 rounded-xl text-white font-bold text-lg flex items-center gap-3"
                >
                  <SaveSettingsIcon className="w-5 h-5" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-1">
              {['general', 'agent', 'apis', 'literature'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSettingsTab(tab)}
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-all ${activeSettingsTab === tab
                    ? 'bg-white/10 text-white border-b-2 border-[#5B9FF0]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                  {tab === 'apis' ? 'API Connections' : tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-8">

              {/* === TAB: GENERAL === */}
              {activeSettingsTab === 'general' && (
                <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Project Context</h3>
                      <p className="text-sm text-gray-400">Define the scientific scope for the AI agent</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-white mb-3">Project Name</label>
                      <input
                        type="text"
                        value={settings.project.name}
                        onChange={e => setSettings({ ...settings, project: { ...settings.project, name: e.target.value } })}
                        className="modern-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Research Type</label>
                      <div className="relative">
                        <select
                          value={settings.project.type}
                          onChange={e => setSettings({ ...settings, project: { ...settings.project, type: e.target.value } })}
                          className="modern-input w-full appearance-none pr-10 cursor-pointer"
                        >
                          <option value="PhD Thesis" className="bg-[#14161B]">PhD Thesis</option>
                          <option value="Literature Review" className="bg-[#14161B]">Literature Review</option>
                          <option value="Drug Repurposing" className="bg-[#14161B]">Drug Repurposing</option>
                          <option value="Methodology Study" className="bg-[#14161B]">Methodology Study</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Disease / Indication</label>
                      <input
                        type="text"
                        value={settings.project.disease_context}
                        onChange={e => setSettings({ ...settings, project: { ...settings.project, disease_context: e.target.value } })}
                        className="modern-input w-full"
                        placeholder="e.g. Alzheimer's Disease"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB: AGENT === */}
              {activeSettingsTab === 'agent' && (
                <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Agent Behavior</h3>
                      <p className="text-sm text-gray-400">Control Agent Zero's autonomy and reasoning</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Autonomy Mode</label>
                        <div className="relative">
                          <select
                            value={settings.agent.mode}
                            onChange={e => setSettings({ ...settings, agent: { ...settings.agent, mode: e.target.value as any } })}
                            className="modern-input w-full appearance-none pr-10 cursor-pointer"
                          >
                            <option value="assisted" className="bg-[#14161B]">Assisted (Ask First)</option>
                            <option value="semi-autonomous" className="bg-[#14161B]">Semi-Autonomous (Milestones)</option>
                            <option value="autonomous" className="bg-[#14161B]">Fully Autonomous</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Reasoning Depth</label>
                        <div className="relative">
                          <select
                            value={settings.agent.reasoning_depth}
                            onChange={e => setSettings({ ...settings, agent: { ...settings.agent, reasoning_depth: e.target.value as any } })}
                            className="modern-input w-full appearance-none pr-10 cursor-pointer"
                          >
                            <option value="shallow" className="bg-[#14161B]">Shallow (Fast)</option>
                            <option value="standard" className="bg-[#14161B]">Standard (PhD Default)</option>
                            <option value="deep" className="bg-[#14161B]">Deep (Rigorous)</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">Self-Correction</h4>
                        <p className="text-xs text-gray-400">Allow agent to retry failed steps automatically</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">Max Retries:</span>
                        <input
                          type="number"
                          value={settings.agent.max_retries}
                          onChange={e => setSettings({ ...settings, agent: { ...settings.agent, max_retries: parseInt(e.target.value) } })}
                          className="modern-input w-20 py-1 px-2 text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* === TAB: USER PERSONA === */}
        {activeSettingsTab === 'persona' && (
          <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Research Persona</h3>
                <p className="text-sm text-gray-400">Adapt Agent Zero's behavior to your intent</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* 1. ROLE */}
              <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-4">Who are you? (Role)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['phd_student', 'researcher', 'industry', 'educator'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSettings({ ...settings, user_persona: { ...settings.user_persona, role: role as any } })}
                      className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${settings.user_persona.role === role ? 'bg-teal-500/20 border-teal-500 text-white' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.user_persona.role === role ? 'border-teal-400' : 'border-gray-500'}`}>
                        {settings.user_persona.role === role && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                      </div>
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. PURPOSE */}
              <div>
                <h4 className="font-semibold text-white mb-4">Primary Purpose</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['phd_thesis', 'literature_review', 'hypothesis_gen', 'methodology'].map((p) => {
                    const isActive = settings.user_persona.primary_purpose.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          const current = settings.user_persona.primary_purpose;
                          const newPurposes = isActive ? current.filter(x => x !== p) : [...current, p];
                          setSettings({ ...settings, user_persona: { ...settings.user_persona, primary_purpose: newPurposes } });
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${isActive ? 'bg-blue-500/20 border-blue-500 text-white' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                      >
                        <span className="capitalize">{p.replace('_', ' ')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. BEHAVIOR CONTROLS */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Scientific Strictness</label>
                  <select
                    value={settings.user_persona.strictness}
                    onChange={(e) => setSettings({ ...settings, user_persona: { ...settings.user_persona, strictness: e.target.value as any } })}
                    className="modern-input w-full bg-[#14161B]"
                  >
                    <option value="exploratory">Exploratory (Open)</option>
                    <option value="balanced">Balanced (PhD Safe)</option>
                    <option value="conservative">Conservative (Strict)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Output Expectation</label>
                  <select
                    value={settings.user_persona.output_expectation}
                    onChange={(e) => setSettings({ ...settings, user_persona: { ...settings.user_persona, output_expectation: e.target.value as any } })}
                    className="modern-input w-full bg-[#14161B]"
                  >
                    <option value="concept">Conceptual/Notes</option>
                    <option value="review_quality">Review Quality</option>
                    <option value="thesis_ready">Thesis Ready</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Research Horizon</label>
                  <select
                    value={settings.user_persona.research_horizon}
                    onChange={(e) => setSettings({ ...settings, user_persona: { ...settings.user_persona, research_horizon: e.target.value as any } })}
                    className="modern-input w-full bg-[#14161B]"
                  >
                    <option value="short">Short (Days)</option>
                    <option value="medium">Medium (Weeks)</option>
                    <option value="long">Long (Months/PhD)</option>
                  </select>
                </div>
              </div>

              {/* TRANSPARENCY NOTE */}
              <div className="p-3 bg-teal-900/10 border border-teal-500/20 rounded-lg text-xs text-teal-400">
                <strong>Active Persona:</strong> Agent Zero will adapt its planning, rigor, and continuity based on these settings. No personal data is profiled or sent to the cloud.
              </div>
            </div>
          </div>
        )}

        {/* === TAB: APIS === */}
        {activeSettingsTab === 'apis' && (
          <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Network className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">External Connections</h3>
                <p className="text-sm text-gray-400">Configure Hybrid AI and Database Access</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* AI Toggle */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">AI Operating Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, mode: 'free_api' } })}
                    className={`p-4 rounded-xl border text-left transition-all ${settings.ai_provider.mode === 'free_api' ? 'bg-[#5B9FF0]/20 border-[#5B9FF0] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                  >
                    <div className="font-bold mb-1">Free API Only</div>
                    <div className="text-xs opacity-70">Use local Ollama and free tiers. No credit card needed.</div>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, mode: 'hybrid' } })}
                    className={`p-4 rounded-xl border text-left transition-all ${settings.ai_provider.mode === 'hybrid' ? 'bg-[#5B9FF0]/20 border-[#5B9FF0] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                  >
                    <div className="font-bold mb-1">Hybrid Mode (Recommended)</div>
                    <div className="text-xs opacity-70">Enhance difficult steps with OpenAI/Elsevier APIs.</div>
                  </button>
                </div>
              </div>

              {/* Keys */}
              {/* Keys */}
              {settings.ai_provider.mode === 'hybrid' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  {/* Provider Selection (No OpenAI) */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Primary Reasoning Model</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl">
                      {['google', 'openrouter', 'huggingface'].map((provider) => (
                        <button
                          key={provider}
                          onClick={() => setSettings({
                            ...settings,
                            ai_provider: { ...settings.ai_provider, primary_model: provider as any }
                          })}
                          className={`py-2 rounded-lg text-sm font-medium transition-all capitalize ${settings.ai_provider.primary_model === provider
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-500 hover:text-white'
                            }`}
                        >
                          {provider === 'google' ? 'Google Gemini' : provider === 'huggingface' ? 'HuggingFace' : 'OpenRouter'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Configurable Inputs based on selection */}
                  {settings.ai_provider.primary_model === 'google' && (
                    <div className="animate-in fade-in duration-300 p-4 bg-white/5 rounded-xl border border-white/10">
                      <label className="block text-sm font-semibold text-white mb-3">Google Gemini Credentials</label>

                      <div className="mb-4">
                        <label className="text-xs text-gray-400 block mb-1">API Key</label>
                        <input
                          type="password"
                          value={settings.ai_provider.google_key || ''}
                          onChange={e => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, google_key: e.target.value } })}
                          className="modern-input w-full"
                          placeholder="AIza..."
                        />
                      </div>

                      <div className="flex justify-end pt-2 border-t border-white/5">
                        <button
                          onClick={() => testConnection('llm')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors font-medium text-sm"
                        >
                          <Activity className="w-4 h-4" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}

                  {settings.ai_provider.primary_model === 'openrouter' && (
                    <div className="animate-in fade-in duration-300 p-4 bg-white/5 rounded-xl border border-white/10">
                      <label className="block text-sm font-semibold text-white mb-3">OpenRouter Credentials</label>

                      <div className="mb-4">
                        <label className="text-xs text-gray-400 block mb-1">API Key</label>
                        <input
                          type="password"
                          value={settings.ai_provider.openrouter_key || ''}
                          onChange={e => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openrouter_key: e.target.value } })}
                          className="modern-input w-full"
                          placeholder="sk-or-..."
                        />
                      </div>

                      <div className="flex justify-end pt-2 border-t border-white/5">
                        <button
                          onClick={() => testConnection('llm')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors font-medium text-sm"
                        >
                          <Activity className="w-4 h-4" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}

                  {settings.ai_provider.primary_model === 'huggingface' && (
                    <div className="animate-in fade-in duration-300 p-4 bg-white/5 rounded-xl border border-white/10">
                      <label className="block text-sm font-semibold text-white mb-3">HuggingFace Credentials</label>

                      <div className="mb-4">
                        <label className="text-xs text-gray-400 block mb-1">Access Token</label>
                        <input
                          type="password"
                          value={settings.ai_provider.huggingface_key || ''}
                          onChange={e => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, huggingface_key: e.target.value } })}
                          className="modern-input w-full"
                          placeholder="hf_..."
                        />
                      </div>

                      <div className="flex justify-end pt-2 border-t border-white/5">
                        <button
                          onClick={() => testConnection('llm')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors font-medium text-sm"
                        >
                          <Activity className="w-4 h-4" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fallback mechanism note */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                    <span className="font-bold block mb-1">Backup Strategy Active</span>
                    If your primary model hits a rate limit, the system will automatically try the other providers using the keys you provide here.
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Elsevier API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.ai_provider.elsevier_key || ''}
                        onChange={e => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, elsevier_key: e.target.value } })}
                        className="modern-input flex-1"
                        placeholder="Elsevier Dev Key"
                      />
                      <button onClick={() => testConnection('elsevier')} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Test</button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white mb-2">PubMed Email (Required for NCBI)</label>
                <input
                  type="email"
                  value={settings.ai_provider.pubmed_email || ''}
                  onChange={e => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, pubmed_email: e.target.value } })}
                  className="modern-input w-full"
                  placeholder="researcher@university.edu"
                />
              </div>
            </div>
          </div>
        )}

        {/* === TAB: LITERATURE (SETTINGS) === */}
        {activeView === 'settings' && (
          <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Literature Scope</h3>
                <p className="text-sm text-gray-400">Define search boundaries and strictness</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-6">
                {/* TIER 1: CORE */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-white">Tier 1: Core Biomedical (Mandatory)</label>
                    <span className="text-xs text-green-400 font-medium px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">Active</span>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={true} disabled className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500" />
                      <div>
                        <span className="text-white block text-sm">PubMed (NCBI)</span>
                        <span className="text-xs text-gray-500">Abstracts, MeSH terms, Gold standard</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={true} disabled className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500" />
                      <div>
                        <span className="text-white block text-sm">Europe PMC</span>
                        <span className="text-xs text-gray-500">Full text (Open Access), Patents, Grants</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TIER 2: METADATA */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Tier 2: Metadata & Discovery</label>
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.literature.sources.includes('openalex')}
                        onChange={(e) => {
                          const newSources = e.target.checked
                            ? [...settings.literature.sources, 'openalex']
                            : settings.literature.sources.filter(s => s !== 'openalex');
                          setSettings({ ...settings, literature: { ...settings.literature, sources: newSources } });
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-white block text-sm">OpenAlex</span>
                        <span className="text-xs text-gray-400">Broad coverage, citation graphs, trend detection</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.literature.enable_crossref}
                        onChange={(e) => setSettings({ ...settings, literature: { ...settings.literature, enable_crossref: e.target.checked } })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-white block text-sm">CrossRef</span>
                        <span className="text-xs text-gray-400">DOI validation, publisher metadata</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TIER 3: PREPRINTS */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Tier 3: Preprints (Optional)</label>
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.literature.enable_preprints}
                        onChange={(e) => setSettings({ ...settings, literature: { ...settings.literature, enable_preprints: e.target.checked } })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                      />
                      <div>
                        <span className="text-white block text-sm">bioRxiv / medRxiv</span>
                        <span className="text-xs text-gray-400">Non-peer-reviewed results. Use with caution.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Search Sources</label>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-4">Active Data Sources</label>
                      <div className="space-y-3">
                        {['pubmed', 'europe_pmc', 'openalex'].map(src => (
                          <label key={src} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.literature.sources.includes(src)}
                              onChange={(e) => {
                                if (e.target.checked) setSettings({ ...settings, literature: { ...settings.literature, sources: [...settings.literature.sources, src] } });
                                else setSettings({ ...settings, literature: { ...settings.literature, sources: settings.literature.sources.filter(s => s !== src) } });
                              }}
                              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="capitalize text-white">{src.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Citations Range (Years)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1" max="50"
                            value={settings.literature.year_range}
                            onChange={e => setSettings({ ...settings, literature: { ...settings.literature, year_range: parseInt(e.target.value) } })}
                            className="w-full accent-blue-500"
                          />
                          <span className="text-xl font-bold text-blue-400 w-16 text-right">{settings.literature.year_range}y</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Novelty Strictness</label>
                        <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                          {['low', 'medium', 'high'].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setSettings({ ...settings, literature: { ...settings.literature, novelty_strictness: lvl as any } })}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${settings.literature.novelty_strictness === lvl ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              </div>
            </div>
        )}
          </div>
      </div>
      );
}

      // Helper component for save icon
      function SaveSettingsIcon() {
  return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      );
}

      function Activity({className}: {className ?: string}) {
  return (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      );
}
