'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';
import ResearchWorkstation from '@/components/ResearchWorkstation';
import NotebookLM from '@/components/NotebookLM';
import FirstRunWizard from '@/components/FirstRunWizard';
import AgentChat from '@/components/AgentChat';
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



  const handleExecute = async () => {
    if (!goal.trim()) {
      setError("Please enter a research goal");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setThinkingSteps([]);
    setCurrentTask(null);

    try {
      // 1. Start Task
      const { taskId } = await api.startResearch(goal, 'synthesize');

      setTaskId(taskId);
      setCurrentTask({
        id: taskId,
        goal,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString()
      });

      // 2. Poll Status
      const interval = setInterval(async () => {
        try {
          const status = await api.getStatus(taskId);

          // Update Task State
          setCurrentTask(prev => prev ? { ...prev, status: status.status, progress: status.progress } : null);

          // Update Thinking Steps (Logs)
          if (status.logs && status.logs.length > 0) {
            const steps = status.logs.map((log: string, idx: number) => {
              let type = 'info';
              let content = log;
              if (log.toLowerCase().includes('thought') || log.includes('Thinking')) type = 'thought';
              else if (log.toLowerCase().includes('action') || log.includes('Executing')) type = 'action';
              else if (log.toLowerCase().includes('result') || log.includes('Found')) type = 'result';

              return { type, content, id: `${taskId}-${idx}`, timestamp: new Date() };
            });
            setThinkingSteps(steps);
          }

          // Check Completion
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            setIsExecuting(false);
            if (status.status === 'failed') setError("Research task failed check logs.");
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);

    } catch (e: any) {
      setError(e.message || "Failed to start research");
      setIsExecuting(false);
    }
  };

  const handleStop = async () => {
    if (!taskId) return;
    try {
      await api.cancelResearch(taskId);
      setIsExecuting(false);
      setError("Research cancelled by user.");
      // Optional: Add a log entry locally or wait for poll to update
      setThinkingSteps(prev => [...prev, { type: 'error', content: 'Process stopped by user.', id: 'cancel', timestamp: new Date() }]);
    } catch (e: any) {
      console.error("Failed to cancel", e);
    }
  };


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

  const c_settings = async (viewOrSettings: any) => {
    // Merge and save
    try {
      // Check if it's a view string (from Advanced Settings button) or settings object
      if (typeof viewOrSettings === 'string') {
        // User clicked "Open Advanced Settings"
        setHasOnboarded(true);
        setActiveView(viewOrSettings); // Navigate to the specified view
      } else {
        // Normal completion with settings object
        const current = await api.getSettings() || {};
        const updated = { ...current, ...viewOrSettings };
        await api.saveSettings(updated);
        setHasOnboarded(true);
      }
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
      case 'agent-chat':
        return (
          <div className="h-full overflow-hidden">
            {/* Import dynamically if needed but we'll import top level for now */}
            <AgentChat />
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
            onStop={handleStop}
            isExecuting={isExecuting}
            thinkingSteps={thinkingSteps}
            error={error}
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

        <main className="flex-1 relative overflow-hidden ml-20">
          {renderContent()}
        </main>
      </div>

      {/* Global Dialogs */}
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
      <DiagnosisDialog
        isOpen={!!diagError}
        onClose={() => setDiagError(null)}
        error={diagError}
        component="System"
      />
    </div>
  );
}
