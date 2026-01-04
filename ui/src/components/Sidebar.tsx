'use client';

import { Home, FlaskConical, FileText, Beaker, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'research', label: 'Research', icon: FlaskConical },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'lab', label: 'Lab Interface', icon: Beaker },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-white/10 bg-[#0a0a0c]/50 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">BioDockify</h1>
            <p className="text-xs text-slate-400">Pharma Research Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">System Online</span>
          </div>
          <p className="text-xs text-slate-500">All services operational</p>
        </div>
      </div>
    </aside>
  );
}
