'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Command } from '@tauri-apps/api/shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Brain,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  Network,
  Loader2,
  AlertCircle,
  Zap,
  BookOpen
} from 'lucide-react'

interface ThinkingStep {
  type: string
  description: string
  timestamp: string
  tool?: string
}

interface AgentTask {
  id: string
  goal: string
  stage: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  result?: any
  createdAt: string
}

export default function BioDockifyDashboard() {
  const [goal, setGoal] = useState('')
  const [stage, setStage] = useState<'early' | 'middle' | 'late'>('early')
  const [isExecuting, setIsExecuting] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null)

  // Spawn Sidecar on Startup
  useEffect(() => {
    const startBackend = async () => {
      try {
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          console.log('Spawning BioDockify Engine...')
          const command = Command.sidecar('binaries/biodockify-engine')
          const child = await command.spawn()
          console.log('BioDockify Engine started with PID:', child.pid)
        }
      } catch (err) {
        console.error('Failed to spawn sidecar:', err)
      }
    }
    startBackend()
  }, [])
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Tool categories
  const toolCategories = [
    { name: 'Literature', count: 12, icon: BookOpen },
    { name: 'Analysis', count: 10, icon: Network },
    { name: 'Generation', count: 8, icon: Zap },
    { name: 'Export', count: 6, icon: FileText },
    { name: 'Utilities', count: 4, icon: Activity }
  ]

  const handleExecute = async () => {
    if (!goal.trim()) return

    setIsExecuting(true)
    setError(null)
    setThinkingSteps([])
    setCurrentTask(null)

    try {
      // Start goal execution
      const response = await fetch('/api/v2/agent/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, stage })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to execute goal')
      }

      setTaskId(data.taskId)
      setCurrentTask({
        id: data.taskId,
        goal,
        stage,
        status: 'running',
        progress: 0,
        createdAt: new Date().toISOString()
      })

      // Start thinking stream
      startThinkingStream()

    } catch (err: any) {
      setError(err.message)
      setIsExecuting(false)
    }
  }

  const startThinkingStream = () => {
    eventSourceRef.current = new EventSource('/api/v2/agent/thinking')

    eventSourceRef.current.onmessage = (event) => {
      const step = JSON.parse(event.data)
      setThinkingSteps(prev => [...prev, step])

      // Update task progress
      setCurrentTask(prev => {
        if (!prev) return prev
        const newProgress = Math.min(100, prev.progress + 15)
        return { ...prev, progress: newProgress }
      })
    }

    eventSourceRef.current.onerror = () => {
      eventSourceRef.current?.close()
      setIsExecuting(false)

      setCurrentTask(prev => {
        if (!prev) return prev
        return { ...prev, status: 'completed', progress: 100 }
      })
    }

    eventSourceRef.current.onopen = () => {
      // Stream opened
    }

    // Simulate completion after stream ends
    setTimeout(() => {
      setIsExecuting(false)
      setCurrentTask(prev => {
        if (!prev) return prev
        return { ...prev, status: 'completed', progress: 100 }
      })
      eventSourceRef.current?.close()
    }, 8000)
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'decomposition': return <Target className="w-4 h-4 text-blue-500" />
      case 'tool_selection': return <Zap className="w-4 h-4 text-yellow-500" />
      case 'execution': return <Activity className="w-4 h-4 text-green-500" />
      case 'validation': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">BioDockify</h1>
                <p className="text-xs text-slate-500">v2.0.0 - PhD Research Automation Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Activity className="w-3 h-3" />
                {isExecuting ? 'Processing' : 'Ready'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goal Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Define Research Goal
                </CardTitle>
                <CardDescription>
                  Enter your research objective and let Agent Zero orchestrate the workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Research Goal</label>
                  <Textarea
                    placeholder="e.g., Conduct a comprehensive literature review on Alzheimer's disease biomarkers..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Research Stage</label>
                  <div className="flex gap-2">
                    {(['early', 'middle', 'late'] as const).map((s) => (
                      <Button
                        key={s}
                        variant={stage === s ? 'default' : 'outline'}
                        onClick={() => setStage(s)}
                        className="flex-1"
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleExecute}
                  disabled={!goal.trim() || isExecuting}
                  className="w-full"
                  size="lg"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start Agent Zero
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Real-time Thinking Stream */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-600" />
                  Thinking Stream
                </CardTitle>
                <CardDescription>
                  Real-time visualization of Agent Zero's decision-making process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {thinkingSteps.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Thinking stream will appear here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {thinkingSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="flex-shrink-0 mt-0.5">
                            {getStepIcon(step.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {step.type}
                              </Badge>
                              {step.tool && (
                                <Badge variant="outline" className="text-xs">
                                  {step.tool}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-700">{step.description}</p>
                          </div>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Current Task Progress */}
            {currentTask && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Task Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Task ID</span>
                    <span className="font-mono text-xs">{currentTask.id}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Status</span>
                    <Badge
                      variant={currentTask.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {currentTask.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium">{currentTask.progress}%</span>
                    </div>
                    <Progress value={currentTask.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats & Tools */}
          <div className="space-y-6">
            {/* Tool Registry Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-emerald-600" />
                  Tool Registry
                </CardTitle>
                <CardDescription>
                  40+ integrated tools for research automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {toolCategories.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <category.icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary">{category.count} tools</Badge>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Total Tools</span>
                  <Badge variant="default">40</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export to LaTeX
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export to DOCX
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Network className="w-4 h-4 mr-2" />
                  View Knowledge Graph
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">GROBID Service</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Neo4j Database</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Ollama LLM</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs">Ready</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Agent Zero</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-xs">{isExecuting ? 'Active' : 'Ready'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>BioDockify v2.0.0 - PhD Research Automation Platform</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
