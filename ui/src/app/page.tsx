'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';
import ResearchWorkstation from '@/components/ResearchWorkstation';
import NotebookLM from '@/components/NotebookLM';
import FirstRunWizard from '@/components/FirstRunWizard';
import { Target, Network, Activity, CheckCircle2, Brain, Clock } from 'lucide-react';

const getStepIcon = (type: string) => {
  switch (type) {
    case 'decomposition':
      return <Target className="h-4 w-4" />
    case 'tool_selection':
      return <Network className="h-4 w-4" />
    case 'execution':
      return <Activity className="h-4 w-4" />
    case 'validation':
      return <CheckCircle2 className="h-4 w-4" />
    case 'analysis':
      return <Brain className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

// --- Main Component ---
export default function PharmaceuticalResearchApp() {
  const [activeView, setActiveView] = useState<string>('home');
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Agent State
  const [goal, setGoal] = useState('');
  const [stage, setStage] = useState('planning');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any | null>(null);

  const startThinkingStream = () => {
    // Placeholder for Priority 1 connection
    const eventSource = new EventSource('/api/v2/agent/thinking');
    eventSource.onmessage = (event) => {
      try {
        const step = JSON.parse(event.data);
        setThinkingSteps(prev => [...prev, step]);
      } catch (e) { }
    };
    // Cleanup needed in real impl
  }

  const handleExecute = async () => {
    if (!goal.trim()) {
      setError("Please enter a research goal")
      return
    }

    setIsExecuting(true)
    setError(null)
    setThinkingSteps([])
    setCurrentTask(null)

    try {
      const response = await fetch('/api/v2/agent/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, stage })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

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

      startThinkingStream()
    } catch (err: any) {
      console.error('Execution error:', err)
      setError(err.message || 'Failed to start research. Please check your connection.')
      setIsExecuting(false)
    }
  }

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const settings = await api.getSettings();
      if (settings?.persona?.role) {
        setHasOnboarded(true);
      }
    } catch (e) {
      console.warn("Failed to check onboarding:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const c_settings = async (newSettings: any) => {
    // Merge and save
    try {
      const current = await api.getSettings() || {};
      const updated = { ...current, ...newSettings };
      await api.saveSettings(updated);
      setHasOnboarded(true);
    } catch (e) {
      console.error("Failed to save wizard settings", e);
      // Allow proceed anyway for demo
      setHasOnboarded(true);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-500">Initializing BioDockify...</div>;

  // Render View Strategy
  const renderContent = () => {
    switch (activeView) {
      case 'settings':
        return (
          <div className="h-full overflow-y-auto p-8">
            <SettingsPanel />
          </div>
        );
      case 'notebooks':
        return (
          <div className="h-full overflow-hidden p-8">
            <NotebookLM />
          </div>
        );
      case 'home':
      case 'research':
      case 'results':
      case 'lab':
      default:
        // For now, all research activities happen in the Workstation
        // Passing view prop to handle specific sub-views
        return (
          <ResearchWorkstation
            view={activeView}
            goal={goal}
            onGoalChange={setGoal}
            onExecute={handleExecute}
            isExecuting={isExecuting}
            thinkingSteps={thinkingSteps}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30">

      {/* First Run Wizard Overlay */}
      {!hasOnboarded && (
        <FirstRunWizard onComplete={c_settings} />
      )}

      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />

      {/* Main Layout */}
      <div className="flex h-screen overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <main className="flex-1 relative overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
