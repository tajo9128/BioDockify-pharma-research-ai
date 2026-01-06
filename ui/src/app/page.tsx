'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';
import ResearchWorkstation from '@/components/ResearchWorkstation';
import FirstRunWizard from '@/components/FirstRunWizard';

// --- Main Component ---
export default function PharmaceuticalResearchApp() {
  const [activeView, setActiveView] = useState<'home' | 'settings'>('home');
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const settings = await api.getSettings();
      // Heuristic: If persona.role is generic or missing, trigger wizard
      // For now, assuming if remote settings exist, we are good.
      // But we want to force the new persona wizard. 
      // Let's check for a specific flag or just always show if not set.
      if (settings?.persona?.role) {
        setHasOnboarded(true);
      }
    } catch (e) {
      console.warn("Failed to check onboarding:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWizardComplete = async (newSettings: any) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30">

      {/* First Run Wizard Overlay */}
      {!hasOnboarded && (
        <FirstRunWizard onComplete={handleWizardComplete} />
      )}

      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />

      {/* Main Layout */}
      <div className="flex h-screen overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={(view: any) => setActiveView(view)} />

        <main className="flex-1 relative overflow-hidden">
          {activeView === 'settings' ? (
            <div className="h-full overflow-y-auto p-8">
              <SettingsPanel />
            </div>
          ) : (
            <ResearchWorkstation />
          )}
        </main>
      </div>
    </div>
  );
}
