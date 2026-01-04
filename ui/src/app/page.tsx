'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Console from '@/components/Console';
import StatsCard from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText, Brain, Network, Download,
  Search, Beaker, FileDown, Clock,
  CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Loader2, Zap, Database,
  Settings2, RefreshCw, Play, Square,
  FlaskConical, FileJson, FileCode
} from 'lucide-react';

interface Log {
  level: string;
  message: string;
  timestamp: Date;
}

interface Entity {
  id: string;
  type: string;
  name: string;
  description?: string;
  confidence: number;
}

interface ResearchSession {
  id: string;
  topic: string;
  status: string;
  step: string;
  progress: number;
  createdAt: Date;
}

export default function PharmaceuticalsApp() {
  const [currentSection, setCurrentSection] = useState('home');
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [settings, setSettings] = useState({
    llmMode: 'local',
    ollamaUrl: 'http://localhost:11434',
    openaiApiKey: '',
    selectedModel: '',
    neo4jHost: 'bolt://localhost:7687',
    neo4jUsername: '',
    neo4jPassword: '',
    apiBaseUrl: 'http://localhost:8000',
  });

  // Simulated recent sessions
  useEffect(() => {
    setResearchSessions([
      {
        id: '1',
        topic: 'CRISPR-Cas9 gene editing in cancer therapy',
        status: 'completed',
        step: 'synthesis',
        progress: 100,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: '2',
        topic: 'Immunotherapy mechanisms in melanoma',
        status: 'completed',
        step: 'synthesis',
        progress: 100,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: '3',
        topic: 'Nanoparticle drug delivery systems',
        status: 'completed',
        step: 'synthesis',
        progress: 100,
        createdAt: new Date(Date.now() - 172800000),
      },
    ]);
  }, []);

  const addLog = (level: string, message: string) => {
    const newLog = { level, message, timestamp: new Date() };
    setLogs(prev => [...prev, newLog]);
  };

  const startResearch = async () => {
    if (!researchTopic.trim()) return;

    setIsResearching(true);
    setLogs([]);
    setEntities([]);

    const newSession = {
      id: Date.now().toString(),
      topic: researchTopic,
      status: 'running',
      step: 'literature',
      progress: 0,
      createdAt: new Date(),
    };
    setCurrentSession(newSession);
    setCurrentSection('research');

    // Simulate research process
    const steps = [
      { name: 'literature', progress: 0 },
      { name: 'extraction', progress: 25 },
      { name: 'graph', progress: 50 },
      { name: 'synthesis', progress: 75 },
    ];

    for (const step of steps) {
      addLog('info', `Starting ${step.name} phase...`);

      // Simulate progress
      for (let i = 0; i <= 25; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setCurrentSession(prev => prev ? { ...prev, progress: Math.min(100, step.progress + i) } : null);
      }

      addLog('success', `${step.name.charAt(0).toUpperCase() + step.name.slice(1)} phase completed`);
    }

    // Add simulated entities
    const sampleEntities: Entity[] = [
      { id: '1', type: 'drug', name: 'Imatinib', description: 'Tyrosine kinase inhibitor', confidence: 0.95 },
      { id: '2', type: 'disease', name: 'Chronic Myeloid Leukemia', description: 'Blood and bone marrow cancer', confidence: 0.92 },
      { id: '3', type: 'protein', name: 'BCR-ABL', description: 'Fusion tyrosine kinase', confidence: 0.98 },
      { id: '4', type: 'drug', name: 'Dasatinib', description: 'Second-generation TKI', confidence: 0.89 },
    ];
    setEntities(sampleEntities);

    addLog('success', 'Research completed successfully!');
    addLog('info', `Found ${sampleEntities.length} entities in literature`);
    addLog('info', 'Knowledge graph generated');

    setCurrentSession(prev => prev ? { ...prev, status: 'completed', step: 'synthesis', progress: 100 } : null);
    setIsResearching(false);

    setResearchSessions(prev => [
      { ...newSession, status: 'completed' as string, step: 'synthesis', progress: 100 },
      ...prev.slice(0, 4),
    ]);

    setTimeout(() => {
      setCurrentSection('results');
    }, 1000);
  };

  const cancelResearch = () => {
    setIsResearching(false);
    addLog('warning', 'Research cancelled by user');
    setCurrentSession(prev => prev ? { ...prev, status: 'failed' } : null);
  };

  const getStepBadge = (step: string) => {
    const steps = ['literature', 'extraction', 'graph', 'synthesis'];
    const currentIndex = steps.indexOf(currentSession?.step || '');
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    } else if (step === currentSession?.step) {
      return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
    } else {
      return <div className="w-5 h-5 rounded-full border-2 border-slate-600" />;
    }
  };

  const renderHomePage = () => (
    <div className="max-w-6xl mx-auto p-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400">AI-Powered Pharmaceutical Research</span>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          BioDockify
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          Accelerate your pharmaceutical research with AI-powered literature analysis,
          entity extraction, and knowledge graph generation
        </p>

        {/* Research Input */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Enter research topic (e.g., CRISPR-Cas9 gene editing, Alzheimer's drug discovery)"
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startResearch()}
              className="pl-12 pr-32 h-14 text-lg bg-black/20 border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-cyan-500/50"
            />
            <Button
              onClick={startResearch}
              disabled={isResearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-lg"
            >
              {isResearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Research
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          {
            icon: <FileText className="w-8 h-8" />,
            title: 'Literature Analysis',
            description: 'Analyze thousands of research papers in seconds',
            color: 'from-blue-500 to-cyan-500',
          },
          {
            icon: <Brain className="w-8 h-8" />,
            title: 'Entity Extraction',
            description: 'Identify drugs, diseases, and proteins automatically',
            color: 'from-purple-500 to-pink-500',
          },
          {
            icon: <Network className="w-8 h-8" />,
            title: 'Knowledge Graph',
            description: 'Visualize complex relationships in biomedical data',
            color: 'from-emerald-500 to-teal-500',
          },
          {
            icon: <Beaker className="w-8 h-8" />,
            title: 'Report Generation',
            description: 'Generate comprehensive research reports automatically',
            color: 'from-orange-500 to-red-500',
          },
        ].map((feature, index) => (
          <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Research Sessions</h2>
          <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
            View All
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="space-y-4">
          {researchSessions.map((session) => (
            <Card
              key={session.id}
              className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer backdrop-blur-sm"
              onClick={() => {
                setCurrentSession(session);
                setCurrentSection('results');
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{session.topic}</h3>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.createdAt.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileJson className="w-4 h-4" />
                        100% Complete
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                    View Results
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResearchPage = () => (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Research Progress</h1>
        <p className="text-slate-400">
          {currentSession?.topic || 'No active research session'}
        </p>
      </div>

      {/* Progress Steps */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
        <CardContent className="p-8">
          <div className="grid grid-cols-4 gap-8 mb-8">
            {[
              { label: 'Literature Search', step: 'literature' },
              { label: 'Entity Extraction', step: 'extraction' },
              { label: 'Graph Building', step: 'graph' },
              { label: 'Synthesis', step: 'synthesis' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  {getStepBadge(item.step)}
                </div>
                <p className={`text-sm font-medium ${
                  currentSession?.step === item.step ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Overall Progress</span>
              <span className="text-white font-medium">{currentSession?.progress || 0}%</span>
            </div>
            <Progress value={currentSession?.progress || 0} className="h-2" />
          </div>

          {/* Cancel Button */}
          {isResearching && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={cancelResearch}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Square className="w-4 h-4 mr-2" />
                Cancel Research
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Console Output */}
      <Console logs={logs} />
    </div>
  );

  const renderResultsPage = () => (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Research Results</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              DOCX
            </Button>
          </div>
        </div>
        <p className="text-slate-400">
          {currentSession?.topic || 'Select a research session to view results'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Papers Analyzed"
          value="1,247"
          icon={<FileText className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Entities Found"
          value={entities.length.toString()}
          icon={<Brain className="w-6 h-6" />}
        />
        <StatsCard
          title="Graph Nodes"
          value="3,482"
          icon={<Network className="w-6 h-6" />}
        />
        <StatsCard
          title="Connections"
          value="8,291"
          icon={<Database className="w-6 h-6" />}
        />
      </div>

      {/* Entities Section */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-white">Extracted Entities</CardTitle>
          <CardDescription className="text-slate-400">
            Drugs, diseases, and proteins identified in the literature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-3">
              {entities.length > 0 ? entities.map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{entity.name}</h4>
                      <Badge
                        variant="outline"
                        className={
                          entity.type === 'drug'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : entity.type === 'disease'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }
                      >
                        {entity.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{entity.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-cyan-400">
                      {(entity.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-slate-600 italic text-center py-8">
                  No entities found. Start a new research to extract entities.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Knowledge Graph Placeholder */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Knowledge Graph</CardTitle>
          <CardDescription className="text-slate-400">
            Visual representation of entity relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center">
            <div className="text-center">
              <Network className="w-16 h-16 text-cyan-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400">
                Interactive knowledge graph visualization
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Click and drag to explore connections
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLabPage = () => (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Lab Interface</h1>
        <p className="text-slate-400">
          Generate protocols and reports from research data
        </p>
      </div>

      <Tabs defaultValue="protocol" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="protocol" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FileCode className="w-4 h-4 mr-2" />
            Protocol Generator
          </TabsTrigger>
          <TabsTrigger value="report" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FileText className="w-4 h-4 mr-2" />
            Report Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="protocol" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Generate Lab Protocol</CardTitle>
              <CardDescription className="text-slate-400">
                Create structured XML protocols for laboratory automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Research Session</Label>
                <div className="mt-2">
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50">
                    <option value="">Select a research session</option>
                    {researchSessions.map(session => (
                      <option key={session.id} value={session.id}>{session.topic}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-white">Protocol Type</Label>
                <div className="mt-2">
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50">
                    <option value="sila">SiLA XML Protocol</option>
                    <option value="custom">Custom Protocol</option>
                    <option value="json">JSON Protocol</option>
                  </select>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3">
                <Beaker className="w-4 h-4 mr-2" />
                Generate Protocol
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Recent Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 italic">No recent exports</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Generate Research Report</CardTitle>
              <CardDescription className="text-slate-400">
                Create comprehensive research reports in DOCX format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Research Session</Label>
                <div className="mt-2">
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50">
                    <option value="">Select a research session</option>
                    {researchSessions.map(session => (
                      <option key={session.id} value={session.id}>{session.topic}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-white">Report Template</Label>
                <div className="mt-2">
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50">
                    <option value="standard">Standard Research Report</option>
                    <option value="executive">Executive Summary</option>
                    <option value="detailed">Detailed Analysis</option>
                    <option value="presentation">Presentation Format</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-white mb-3">Include Sections</Label>
                <div className="space-y-2">
                  {['Abstract', 'Introduction', 'Methodology', 'Results', 'Discussion', 'References'].map(section => (
                    <div key={section} className="flex items-center space-x-2">
                      <Switch id={section} defaultChecked />
                      <Label htmlFor={section} className="text-slate-300 cursor-pointer">{section}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderSettingsPage = () => (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">
          Configure application settings and connections
        </p>
      </div>

      <div className="space-y-6">
        {/* LLM Configuration */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">LLM Configuration</CardTitle>
            <CardDescription className="text-slate-400">
              Configure AI model settings for research tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">LLM Mode</Label>
                <p className="text-sm text-slate-400">Choose between local or cloud AI models</p>
              </div>
              <div className="flex items-center space-x-2 bg-black/20 rounded-lg p-1">
                <Button
                  variant={settings.llmMode === 'local' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSettings({ ...settings, llmMode: 'local' })}
                  className={settings.llmMode === 'local' ? 'bg-cyan-600 text-white' : 'text-slate-400'}
                >
                  Local
                </Button>
                <Button
                  variant={settings.llmMode === 'cloud' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSettings({ ...settings, llmMode: 'cloud' })}
                  className={settings.llmMode === 'cloud' ? 'bg-cyan-600 text-white' : 'text-slate-400'}
                >
                  Cloud
                </Button>
              </div>
            </div>

            {settings.llmMode === 'local' ? (
              <div>
                <Label className="text-white">Ollama Server URL</Label>
                <Input
                  value={settings.ollamaUrl}
                  onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                  className="mt-2 bg-black/20 border-white/10 text-white"
                  placeholder="http://localhost:11434"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-white/10 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            ) : (
              <div>
                <Label className="text-white">OpenAI API Key</Label>
                <Input
                  type="password"
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  className="mt-2 bg-black/20 border-white/10 text-white"
                  placeholder="sk-..."
                />
                <div className="mt-2">
                  <Label className="text-white">Model</Label>
                  <select className="mt-2 w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Configuration */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Database Configuration</CardTitle>
            <CardDescription className="text-slate-400">
              Configure Neo4j graph database connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Neo4j Host</Label>
              <Input
                value={settings.neo4jHost}
                onChange={(e) => setSettings({ ...settings, neo4jHost: e.target.value })}
                className="mt-2 bg-black/20 border-white/10 text-white"
                placeholder="bolt://localhost:7687"
              />
            </div>

            <div>
              <Label className="text-white">Username</Label>
              <Input
                value={settings.neo4jUsername}
                onChange={(e) => setSettings({ ...settings, neo4jUsername: e.target.value })}
                className="mt-2 bg-black/20 border-white/10 text-white"
                placeholder="neo4j"
              />
            </div>

            <div>
              <Label className="text-white">Password</Label>
              <Input
                type="password"
                value={settings.neo4jPassword}
                onChange={(e) => setSettings({ ...settings, neo4jPassword: e.target.value })}
                className="mt-2 bg-black/20 border-white/10 text-white"
                placeholder="••••••••"
              />
            </div>

            <Button
              variant="outline"
              className="border-white/10 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          </CardContent>
        </Card>

        {/* Backend Configuration */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Backend Configuration</CardTitle>
            <CardDescription className="text-slate-400">
              API server connection settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">API Base URL</Label>
              <Input
                value={settings.apiBaseUrl}
                onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                className="mt-2 bg-black/20 border-white/10 text-white"
                placeholder="http://localhost:8000"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Connected</span>
              </div>
              <span className="text-sm text-slate-400">Server operational</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex">
      <Sidebar currentSection={currentSection} onSectionChange={setCurrentSection} />
      <main className="flex-1 overflow-auto">
        {currentSection === 'home' && renderHomePage()}
        {currentSection === 'research' && renderResearchPage()}
        {currentSection === 'results' && renderResultsPage()}
        {currentSection === 'lab' && renderLabPage()}
        {currentSection === 'settings' && renderSettingsPage()}
      </main>
    </div>
  );
}
