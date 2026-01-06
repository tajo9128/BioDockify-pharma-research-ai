'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Settings as SettingsIcon,
  Database,
  Brain,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  Lock,
  Zap,
  AlertCircle
} from 'lucide-react'

interface ProviderStatus {
  name: string
  type: string
  available: boolean
  enabled: boolean
}

interface SettingsProps {
  onSettingsChange?: (settings: any) => void
}

export function SettingsPanel({ onSettingsChange }: SettingsProps) {
  const [llmProvider, setLLMProvider] = useState<string>('auto')
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [maxPapers, setMaxPapers] = useState('50')
  const [outputLanguage, setOutputLanguage] = useState('en')
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto')

  // Check provider status
  const checkProviderStatus = async () => {
    setIsChecking(true)

    try {
      const response = await fetch('/api/settings/providers/status')
      if (response.ok) {
        const data = await response.json()
        setProviderStatus(data.providers)
      }
    } catch (error) {
      console.error('Failed to check provider status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setLLMProvider(data.llmProvider || 'auto')
          setOllamaUrl(data.ollamaUrl || 'http://localhost:11434')
          setMaxPapers(data.maxPapers || '50')
          setOutputLanguage(data.outputLanguage || 'en')
          setTheme(data.theme || 'auto')
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadSettings()
    checkProviderStatus()
  }, [])

  // Save settings
  const saveSettings = async (settings: any) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        console.log('Settings saved successfully')
        if (onSettingsChange) {
          onSettingsChange(settings)
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleLLMProviderChange = (value: string) => {
    setLLMProvider(value)
    saveSettings({ llmProvider: value })
  }

  const handleOllamaUrlChange = (value: string) => {
    setOllamaUrl(value)
    saveSettings({ ollamaUrl: value })
  }

  const handleMaxPapersChange = (value: string) => {
    setMaxPapers(value)
    saveSettings({ maxPapers: parseInt(value) })
  }

  const handleLanguageChange = (value: string) => {
    setOutputLanguage(value)
    saveSettings({ outputLanguage: value })
  }

  const handleThemeChange = (value: 'light' | 'dark' | 'auto') => {
    setTheme(value)
    saveSettings({ theme: value })
  }

  const getProviderIcon = (name: string) => {
    switch (name) {
      case 'ollama':
        return <Brain className="w-4 h-4" />
      case 'z-ai':
        return <Zap className="w-4 h-4" />
      default:
        return <Database className="w-4 h-4" />
    }
  }

  const getProviderDisplayName = (name: string) => {
    switch (name) {
      case 'ollama':
        return 'Ollama (Local)'
      case 'z-ai':
        return 'z-ai (Cloud)'
      default:
        return name
    }
  }

  return (
    <div className="space-y-6">
      {/* LLM Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Provider Settings
          </CardTitle>
          <CardDescription>
            Choose your preferred AI provider. Local providers offer privacy and offline access, while cloud providers may have more capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Provider</label>
            <Select value={llmProvider} onValueChange={handleLLMProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                <SelectItem value="ollama">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    <span>Ollama (Local)</span>
                  </div>
                </SelectItem>
                <SelectItem value="z-ai">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>z-ai (Cloud)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {llmProvider === 'auto' && 'Automatically selects best available provider'}
              {llmProvider === 'ollama' && 'Uses local Ollama instance for maximum privacy'}
              {llmProvider === 'z-ai' && 'Uses z-ai cloud service'}
            </p>
          </div>

          {/* Provider Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Provider Status</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkProviderStatus}
                disabled={isChecking}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              {providerStatus.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Click refresh to check provider status
                </div>
              ) : (
                providerStatus.map((provider) => (
                  <div
                    key={provider.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        {getProviderIcon(provider.name)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {getProviderDisplayName(provider.name)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {provider.type}
                          </Badge>
                          <Badge
                            variant={provider.available ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {provider.available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {provider.available ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ollama Settings */}
          {llmProvider === 'ollama' || llmProvider === 'auto' ? (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <label className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Ollama Server URL
              </label>
              <Input
                value={ollamaUrl}
                onChange={(e) => handleOllamaUrlChange(e.target.value)}
                placeholder="http://localhost:11434"
              />
              <p className="text-xs text-muted-foreground">
                Ensure Ollama is running on this URL. Default: http://localhost:11434
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Research Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Research Settings
          </CardTitle>
          <CardDescription>Configure your research preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Research Mode</label>
            <Select defaultValue="synthesize">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="search">Literature Search</SelectItem>
                <SelectItem value="synthesize">Knowledge Synthesis</SelectItem>
                <SelectItem value="write">Protocol Generation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Papers to Analyze</label>
            <Input
              type="number"
              value={maxPapers}
              onChange={(e) => handleMaxPapersChange(e.target.value)}
              min="1"
              max="500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Output Language</label>
            <Select value={outputLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文 (Chinese)</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="de">Deutsch (German)</SelectItem>
                <SelectItem value="ja">日本語 (Japanese)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Knowledge Graph</p>
              <p className="text-xs text-muted-foreground">Neo4j database connection</p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Literature Database</p>
              <p className="text-xs text-muted-foreground">PubMed and arXiv access</p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the application look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <Select value={theme} onValueChange={(v) => handleThemeChange(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (System)</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Compact Mode</label>
              <p className="text-xs text-muted-foreground">Use smaller spacing and fonts</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Animations</label>
              <p className="text-xs text-muted-foreground">Enable interface animations</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
