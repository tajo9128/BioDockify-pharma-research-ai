'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Search,
  Database,
  FileText,
  Download,
  Zap,
  CheckCircle2,
  Play,
  RefreshCw,
  TestTube,
  Settings as SettingsIcon,
  FileOutput,
  Sparkles,
  TrendingUp,
  Network,
  Atom,
  Microscope,
  Beaker,
  Calendar,
  Clock,
  Globe,
  Award,
  Target,
  Lightbulb,
  ChevronRight,
  Star,
  Rocket,
  ChevronDown,
  PenTool,
  BookOpen,
  MessageSquare,
  Brain,
  Lock,
  Shield,
  Plus,
  FileUp,
  Loader2
} from 'lucide-react'

export default function PharmaceuticalResearchApp() {
  const [activeView, setActiveView] = useState('home')
  const [researchTopic, setResearchTopic] = useState('')
  const [researchMode, setResearchMode] = useState<'search' | 'synthesize' | 'write'>('synthesize')
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [researchResults, setResearchResults] = useState<any>(null)
  const [consoleLogs, setConsoleLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }>>([])
  const [recentResearches, setRecentResearches] = useState<Array<{ id: string; topic: string; date: string; status: string }>>([])

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const log = {
      timestamp: new Date().toISOString(),
      message,
      type
    }
    setConsoleLogs(prev => [...prev.slice(-49), log])
  }

  const startResearch = async () => {
    if (!researchTopic.trim()) {
      addLog('Please enter a research topic', 'error')
      return
    }

    setIsProcessing(true)
    addLog(`Starting ${researchMode} research: "${researchTopic}"`, 'info')

    try {
      // Simulate API call
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: researchTopic,
          mode: researchMode
        })
      })

      if (!response.ok) {
        throw new Error('Research request failed')
      }

      const data = await response.json()
      setCurrentTaskId(data.taskId)
      addLog(`Research initiated with ID: ${data.taskId}`, 'success')

      // Simulate processing
      await simulateProcessing()

      setResearchResults({
        summary: `AI analysis complete for: ${researchTopic}`,
        findings: [
          'Identified 15 relevant compounds',
          'Analyzed 47 research papers',
          'Generated 3 potential drug candidates',
          'Created laboratory protocols'
        ],
        status: 'completed'
      })

      setRecentResearches(prev => [...prev, {
        id: data.taskId,
        topic: researchTopic,
        date: new Date().toISOString(),
        status: 'completed'
      }])

      addLog('Research completed successfully', 'success')
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const simulateProcessing = async () => {
    const steps = [
      { message: 'Initializing research pipeline...', delay: 1000 },
      { message: 'Searching academic databases...', delay: 2000 },
      { message: 'Analyzing literature...', delay: 2000 },
      { message: 'Extracting biomedical entities...', delay: 1500 },
      { message: 'Building knowledge graph...', delay: 1500 },
      { message: 'Generating insights...', delay: 2000 },
      { message: 'Creating protocols...', delay: 1500 }
    ]

    for (const step of steps) {
      addLog(step.message, 'info')
      await new Promise(resolve => setTimeout(resolve, step.delay))
    }
  }

  const renderHomeView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
          <Atom className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Pharmaceutical Research AI</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Democratizing pharmaceutical research through AI-powered literature analysis, drug discovery, and protocol generation
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+127 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drug Candidates</CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+23 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocols Generated</CardTitle>
            <FileOutput className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Graph</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5K</div>
            <p className="text-xs text-muted-foreground">Entities connected</p>
          </CardContent>
        </Card>
      </div>

      {/* Research Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Start New Research
          </CardTitle>
          <CardDescription>
            Choose a research mode and enter your research topic to begin AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Tabs */}
          <Tabs value={researchMode} onValueChange={(v) => setResearchMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="synthesize" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Synthesize
              </TabsTrigger>
              <TabsTrigger value="write" className="flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Write
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Literature Search
                </h4>
                <p className="text-sm text-muted-foreground">
                  Search and analyze academic literature for your research topic. AI will extract relevant papers, summarize findings, and identify key insights.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Access PubMed, arXiv, and other databases</li>
                  <li>• Extract biomedical entities (BioNER)</li>
                  <li>• Summarize key findings</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="synthesize" className="space-y-4">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Knowledge Synthesis
                </h4>
                <p className="text-sm text-muted-foreground">
                  Synthesize information from multiple sources to generate comprehensive insights and drug candidate recommendations.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Build knowledge graphs from literature</li>
                  <li>• Identify drug candidates</li>
                  <li>• Generate novel insights</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="write" className="space-y-4">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Protocol Generation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Generate detailed laboratory protocols and experimental procedures based on research findings.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Step-by-step protocols</li>
                  <li>• Material lists and quantities</li>
                  <li>• Safety guidelines</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {/* Input Area */}
          <div className="space-y-4">
            <div>
              <label htmlFor="research-topic" className="text-sm font-medium mb-2 block">
                Research Topic
              </label>
              <Textarea
                id="research-topic"
                placeholder="Enter your research topic or question (e.g., 'Novel therapeutic approaches for Alzheimer's disease')"
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={startResearch}
                disabled={isProcessing || !researchTopic.trim()}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Research
                  </>
                )}
              </Button>
              <Button variant="outline" disabled={isProcessing}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results */}
          {researchResults && (
            <div className="border rounded-lg p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Research Complete</h3>
              </div>
              <p className="text-sm text-muted-foreground">{researchResults.summary}</p>
              <div className="space-y-2">
                {researchResults.findings.map((finding: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    {finding}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
                <Button variant="outline" size="sm">
                  <FileOutput className="w-4 h-4 mr-2" />
                  View Protocol
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Research */}
      {recentResearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentResearches.slice(-5).reverse().map((research) => (
                <div key={research.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{research.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(research.date).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {research.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderConsoleView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Console Logs
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setConsoleLogs([])}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto bg-black text-green-400 p-4 rounded-lg font-mono text-sm space-y-2">
          {consoleLogs.length === 0 ? (
            <p className="text-muted-foreground">No logs yet. Start a research task to see logs here.</p>
          ) : (
            consoleLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-muted-foreground">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`
                  ${log.type === 'error' ? 'text-red-400' : ''}
                  ${log.type === 'success' ? 'text-green-400' : ''}
                  ${log.type === 'warning' ? 'text-yellow-400' : ''}
                  ${log.type === 'info' ? 'text-blue-400' : ''}
                `}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderSettingsView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>Configure your research preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Research Mode</label>
            <select className="w-full p-2 border rounded-md">
              <option value="search">Literature Search</option>
              <option value="synthesize">Knowledge Synthesis</option>
              <option value="write">Protocol Generation</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Papers to Analyze</label>
            <Input type="number" defaultValue="50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Output Language</label>
            <select className="w-full p-2 border rounded-md">
              <option value="en">English</option>
              <option value="zh">Chinese</option>
              <option value="es">Spanish</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Knowledge Graph</p>
              <p className="text-xs text-muted-foreground">Neo4j database connection</p>
            </div>
            <Badge variant="outline">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Literature Database</p>
              <p className="text-xs text-muted-foreground">PubMed and arXiv access</p>
            </div>
            <Badge variant="outline">Connected</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Atom className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">PharmaResearch AI</span>
          </div>
          <nav className="ml-auto flex items-center gap-2">
            <Button
              variant={activeView === 'home' ? 'default' : 'ghost'}
              onClick={() => setActiveView('home')}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant={activeView === 'console' ? 'default' : 'ghost'}
              onClick={() => setActiveView('console')}
            >
              <Terminal className="w-4 h-4 mr-2" />
              Console
            </Button>
            <Button
              variant={activeView === 'settings' ? 'default' : 'ghost'}
              onClick={() => setActiveView('settings')}
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 px-4">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'console' && renderConsoleView()}
        {activeView === 'settings' && renderSettingsView()}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Built with Next.js 15, shadcn/ui, and z-ai-web-dev-sdk</p>
          <p className="mt-1">Open-source pharmaceutical research AI platform</p>
        </div>
      </footer>
    </>
  )
}

const Terminal = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
)

const Home = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
)
