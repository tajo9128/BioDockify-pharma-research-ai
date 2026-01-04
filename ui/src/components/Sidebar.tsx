'use client';

import { Home, FlaskConical, FileText, Beaker, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'research', icon: FlaskConical, label: 'Research' },
    { id: 'results', icon: FileText, label: 'Results' },
    { id: 'lab', icon: Beaker, label: 'Lab Interface' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-20 bg-gradient-to-b from-[#0D0E12] to-[#14161B] border-r border-white/5 flex flex-col items-center py-8 z-50">
      {/* Logo */}
      <div className="mb-10 animate-float">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B9FF0] to-[#4A90E2] flex items-center justify-center shadow-2xl shadow-[#5B9FF0]/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col gap-2 w-full px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group',
                isActive
                  ? 'bg-gradient-to-br from-[#5B9FF0] to-[#4A90E2] shadow-lg shadow-[#5B9FF0]/40'
                  : 'bg-white/[0.02] hover:bg-white/10 border border-transparent hover:border-white/10'
              )}
            >
              {isActive && (
                <div className="absolute -left-[11px] w-1 h-8 bg-gradient-to-b from-[#5B9FF0] to-[#4A90E2] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'w-6 h-6 transition-colors',
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                )}
              />
              {/* Tooltip */}
              <div className={cn(
                'absolute left-full ml-4 px-3 py-2 bg-[#1A1D24] text-white text-sm font-medium rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50',
                'shadow-xl'
              )}>
                {item.label}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-[#1A1D24] border-l border-b border-white/10 rotate-45" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Indicator */}
      <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#5B9FF0] via-[#8B7CFD] to-[#4A90E2] opacity-50" />
    </div>
  );
}
