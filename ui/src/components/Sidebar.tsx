'use client';

import React, { useState } from 'react';
import { Home, FlaskConical, FileText, Beaker, Settings, Sparkles, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'research', icon: FlaskConical, label: 'ResearchWorkstation' }, // Updated label for clarity
    { id: 'results', icon: FileText, label: 'Results' },
    { id: 'notebooks', icon: BookOpen, label: 'Notebooks' },
    { id: 'lab', icon: Beaker, label: 'Lab Interface' },
    { id: 'agent-chat', icon: Sparkles, label: 'Agent Zero' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div
      className={cn(
        "h-full bg-gradient-to-b from-[#0D0E12] to-[#14161B] border-r border-white/5 flex flex-col items-center py-6 z-50 transition-all duration-300 ease-in-out flex-shrink-0 relative",
        isCollapsed ? "w-5" : "w-20"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-50 shadow-lg"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={cn("mb-8 transition-opacity duration-200", isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B9FF0] to-[#4A90E2] flex items-center justify-center shadow-lg shadow-[#5B9FF0]/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col gap-3 w-full px-2 items-center">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (isCollapsed) return null; // Hide icons when collapsed effectively, or we could keep small ones? User said "hide".
          // Let's hide them to make it very slim (5px strip) as implied by "disturbing". 
          // Actually, standard behavior is icon-only mode vs text. This WAS icon-only. 
          // So "hide" implies making it gone. 
          // If I make width w-4 (1rem), it's basically a strip.

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group',
                isActive
                  ? 'bg-gradient-to-br from-[#5B9FF0] to-[#4A90E2] shadow-md shadow-[#5B9FF0]/30'
                  : 'bg-white/[0.02] hover:bg-white/10'
              )}
            >
              {isActive && (
                <div className="absolute -left-[9px] w-1 h-6 bg-gradient-to-b from-[#5B9FF0] to-[#4A90E2] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                )}
              />
              {/* Tooltip */}
              <div className={cn(
                'absolute left-full ml-4 px-3 py-2 bg-[#1A1D24] text-white text-xs font-medium rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50',
                'shadow-xl'
              )}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Indicator */}
      {!isCollapsed && <div className="w-8 h-1 rounded-full bg-gradient-to-r from-[#5B9FF0] via-[#8B7CFD] to-[#4A90E2] opacity-30" />}
    </div>
  );
}
