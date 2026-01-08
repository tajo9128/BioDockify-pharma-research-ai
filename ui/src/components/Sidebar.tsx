'use client';

import React from 'react';
import { Home, FlaskConical, FileText, Beaker, Settings, Sparkles, BookOpen, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'research', icon: FlaskConical, label: 'Workstation' },
    { id: 'results', icon: FileText, label: 'Results' },
    { id: 'notebooks', icon: BookOpen, label: 'Notebooks' },
    { id: 'lab', icon: Beaker, label: 'Virtual Lab' },
    { id: 'agent-chat', icon: Sparkles, label: 'Agent Zero' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6">

      {/* Brand Logo - Floating */}
      <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center p-3 animate-float shadow-2xl relative group cursor-default">
        <Image src="/logo_small.svg" alt="BioDockify" width={32} height={32} className="w-full h-full drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(0,212,170,0.5)] transition-all" />
      </div>

      {/* Navigation Dock - Floating Glass Strip */}
      <nav className="glass-panel rounded-3xl p-3 flex flex-col gap-4 shadow-2xl border border-white/5 backdrop-blur-2xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative",
                  isActive
                    ? "bg-gradient-to-br from-teal-500/20 to-teal-400/5 text-teal-400 border border-teal-500/30 shadow-[0_0_20px_-5px_rgba(20,184,166,0.3)]"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:scale-105"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "animate-pulse-soft")} strokeWidth={isActive ? 2.5 : 2} />

                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-teal-400 rounded-full shadow-[0_0_10px_#00D4AA]" />
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 glass-panel rounded-lg text-xs font-semibold text-slate-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-xl z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Status / Fingerprint - Floating */}
      <div className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-600 hover:text-teal-500 transition-colors cursor-pointer" title="Secure Session Active">
        <Fingerprint className="w-5 h-5" />
      </div>

    </aside>
  );
}
