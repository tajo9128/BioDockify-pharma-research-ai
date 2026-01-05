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
  ChevronRight, Star, Rocket, ChevronDown
} from 'lucide-react';

export default function PharmaceuticalResearchApp() {
  const [activeView, setActiveView] = useState('home');
  const [researchTopic, setResearchTopic] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResults | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [recentResearches, setRecentResearches] = useState<any[]>([]);
  const [recentExports, setRecentExports] = useState<any[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
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
      const { taskId } = await api.startResearch(researchTopic);
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
    <div className="min-h-screen bg-gradient-orbs">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="ml-20 p-8 relative z-10">
        {activeView === 'home' && (
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5B9FF0]/10 to-[#4A90E2]/10 border border-white/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[#5B9FF0]" />
                <span className="text-sm font-medium text-gray-300">AI-Powered Research Platform</span>
              </div>

              <h1 className="text-6xl font-bold mb-6 relative">
                <span className="gradient-text">BioDockify</span>
                <span className="text-white"> AI</span>
              </h1>

              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Transform pharmaceutical research with AI-powered literature analysis,
                knowledge graph construction, and automated lab protocols
              </p>

              {/* Stats Banner */}
              <div className="flex justify-center gap-8 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-gray-500 mt-1">Papers Analyzed</div>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">500+</div>
                  <div className="text-sm text-gray-500 mt-1">Active Researchers</div>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">99%</div>
                  <div className="text-sm text-gray-500 mt-1">Accuracy Rate</div>
                </div>
              </div>
            </div>

            {/* Search Card */}
            <div className="glass-card p-8 mb-10 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-10 bg-gradient-to-br from-[#5B9FF0] to-[#4A90E2]" />
              <div className="relative">
                <label className="block text-lg font-semibold text-white mb-4">
                  <Search className="w-5 h-5 inline mr-2 text-[#5B9FF0]" />
                  Start Your Research
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={researchTopic}
                    onChange={(e) => setResearchTopic(e.target.value)}
                    placeholder="Enter your research topic (e.g., 'Drug interactions in Alzheimer's treatment')"
                    className="modern-input flex-1 text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && startResearch()}
                  />
                  <button
                    onClick={startResearch}
                    className="glow-button px-8 py-4 rounded-2xl text-white font-bold text-lg flex items-center gap-3"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Research</span>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Powered by advanced AI models and comprehensive scientific databases
                </p>
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <Rocket className="w-8 h-8 text-[#5B9FF0]" />
                  Research Progress
                </h2>
                <p className="text-gray-400">
                  Task ID: <span className="font-mono text-[#4A90E2]">{currentTaskId}</span>
                </p>
              </div>
              {researchStatus && (
                <div className="flex items-center gap-4">
                  <StatusBadge status={researchStatus.status as any} size="lg" />
                  {researchStatus.status === 'running' && (
                    <button
                      onClick={cancelResearch}
                      className="px-6 py-3 bg-[#FC8181]/10 hover:bg-[#FC8181]/20 text-[#FC8181] border border-[#FC8181]/30 rounded-xl flex items-center gap-2 transition-colors font-semibold"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="glass-card p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <ProgressStep
                  step={1}
                  currentStep={researchStatus?.currentStep || 0}
                  totalSteps={4}
                  label="Literature Search"
                />
                <ProgressStep
                  step={2}
                  currentStep={researchStatus?.currentStep || 0}
                  totalSteps={4}
                  label="Entity Extraction"
                />
                <ProgressStep
                  step={3}
                  currentStep={researchStatus?.currentStep || 0}
                  totalSteps={4}
                  label="Knowledge Graph"
                />
                <ProgressStep
                  step={4}
                  currentStep={researchStatus?.currentStep || 0}
                  totalSteps={4}
                  label="Analysis"
                  isLast
                />
              </div>

              {researchStatus && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-400 font-medium">Overall Progress</span>
                    <span className="text-[#5B9FF0] font-bold text-lg">{researchStatus.progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#5B9FF0] via-[#9B8BFF] to-[#4A90E2] transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${researchStatus.progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Activity className="w-4 h-4" />
                    <span>Current Phase: <span className="text-white font-medium">{researchStatus.phase}</span></span>
                  </div>
                </div>
              )}
            </div>

            {/* Console */}
            <Console
              logs={consoleLogs}
              title={researchStatus?.phase || 'Console Output'}
            />
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
                      await api.apiRequest('/settings/reset', { method: 'POST' });
                      loadSettings();
                      addConsoleLog('Settings reset to defaults', 'warning');
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
                    {settings.ai_provider.mode === 'hybrid' && (
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">OpenAI API Key</label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={settings.ai_provider.openai_key || ''}
                              onChange={e => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openai_key: e.target.value } })}
                              className="modern-input flex-1"
                              placeholder="sk-..."
                            />
                            <button onClick={() => testConnection('llm')} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Test</button>
                          </div>
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

              {/* === TAB: LITERATURE === */}
              {activeSettingsTab === 'literature' && (
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

function Activity({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
