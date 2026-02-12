
import React from 'react';
import { Brain, Cpu, Zap, Lock, Activity } from 'lucide-react';

interface SettingsLayoutProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    children: React.ReactNode;
}

export function SettingsLayout({ activeTab, setActiveTab, children }: SettingsLayoutProps) {
    const tabs = [
        { id: 'models', label: 'Model Intelligence', icon: Brain },
        { id: 'lite', label: 'BioDockify AI Lite', icon: Zap },
        { id: 'research', label: 'BioDockify AI (Research)', icon: Cpu },
        { id: 'system', label: 'System & Security', icon: Lock },
        { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
    ];

    return (
        <div className="flex h-full bg-slate-900 text-slate-200">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-800 p-4">
                <h2 className="text-xl font-bold text-emerald-400 mb-6 px-2">Settings</h2>
                <nav className="space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                        ? 'bg-emerald-900/50 text-emerald-400'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
