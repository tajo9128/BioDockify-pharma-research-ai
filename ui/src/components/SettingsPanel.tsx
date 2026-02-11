import React, { useState, useEffect, useCallback } from 'react';
import { api, Settings } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { SettingsSidebar } from './settings/SettingsSidebar';
import { GeneralSettings } from './settings/GeneralSettings';
import { AgentSettings } from './settings/AgentSettings';
import { BrainSettings } from './settings/BrainSettings';
import { ResearchSettings } from './settings/ResearchSettings';
import { SystemSettings } from './settings/SystemSettings';
import ChannelsSettingsPanel from './ChannelsSettingsPanel';

// Default State (Fallback)
const defaultSettings: Settings = {
    project: { name: 'New Project', type: 'Drug Discovery', disease_context: 'Alzheimer\'s', stage: 'Early Discovery' },
    agent: {
        mode: 'assisted',
        reasoning_depth: 'standard',
        self_correction: true,
        max_retries: 3,
        failure_policy: 'ask_user',
        max_runtime_minutes: 45,
        use_knowledge_graph: true,
        human_approval_gates: true
    },
    nanobot: {
        headless_browser: true,
        stealth_mode: false,
        browser_timeout: 30
    },
    literature: {
        sources: ['pubmed'],
        enable_crossref: true,
        enable_preprints: false,
        year_range: 5,
        novelty_strictness: 'medium',
        grobid_url: 'http://localhost:8070'
    },
    system: { max_cpu_percent: 80, internet_research: true, auto_update: true, log_level: 'INFO' },
    ai_provider: {
        mode: 'lm_studio',
        lm_studio_url: 'http://localhost:1234/v1/models',
        google_model: '',
        groq_model: 'llama-3.3-70b-versatile',
        surfsense_url: 'http://localhost:3003',
        surfsense_auto_start: false,
        bohrium_url: 'http://localhost:8000',
    },
    ai_advanced: { context_window: 4096, gpu_layers: -1, thread_count: 8 },
    pharma: {
        enable_pubtator: true, enable_semantic_scholar: true, enable_unpaywall: true, citation_threshold: 'high',
        sources: {
            pubmed: true, pmc: true, openalex: true, clinicaltrials: true,
            biorxiv: false, chemrxiv: false, google_scholar: false, semantic_scholar: false, ieee: false, elsevier: false, scopus: false, wos: false, science_index: false
        }
    },
    persona: { role: 'PhD Student', strictness: 'balanced', introduction: '', research_focus: '', department: 'Pharmacology' },
    output: { format: 'markdown', citation_style: 'apa', include_disclosure: true, output_dir: '' }
};

export default function SettingsPanel() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('general');

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getSettings();
            if (data) setSettings({ ...defaultSettings, ...data });
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast({ title: "Error loading settings", description: "Using default configuration.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.saveSettings(settings);
            toast({ title: "Configuration Saved", description: "Your settings have been updated successfully." });
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast({ title: "Save Failed", description: "Could not persist configuration.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        try {
            const res = await api.resetSettings();
            if (res.success) {
                setSettings({ ...defaultSettings, ...res.config });
                toast({ title: "Settings Reset", description: "Restored to factory defaults." });
            }
        } catch (_error) {
            toast({ title: "Reset Failed", description: "Could not reset settings.", variant: "destructive" });
        }
    };

    const handleSettingChange = (section: keyof Settings, value: any) => {
        setSettings(prev => ({ ...prev, [section]: value }));
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span className="text-lg">Loading configuration...</span>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'brain':
                return <BrainSettings settings={settings} onSettingChange={handleSettingChange} />;
            case 'agent':
                return <AgentSettings settings={settings} onSettingChange={handleSettingChange} />;
            case 'research':
                return <ResearchSettings settings={settings} onSettingChange={handleSettingChange} />;
            case 'channels':
                return <ChannelsSettingsPanel />;
            case 'system':
                return <SystemSettings settings={settings} onSettingChange={handleSettingChange} onReset={handleReset} />;
            default:
                return <GeneralSettings settings={settings} onSettingChange={handleSettingChange} />;
        }
    };

    return (
        <div className="flex h-full bg-background text-foreground overflow-hidden rounded-xl border border-border shadow-sm">
            {/* Sidebar Navigation */}
            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/50">
                {/* The following interface and component are likely intended for a different file or context,
                    but are placed here as per the user's instruction to insert them. */}
                {/*interface ToggleCardProps {
    icon: React.ElementType;
    label: string;
    enabled: boolean;
    onClick: () => void;
    color?: string;
}

const ToggleCard = ({ icon: Icon, label, enabled, onClick, color = 'teal' }: ToggleCardProps) => (
    <button onClick={onClick} className={`flex items-center p-3 rounded-lg border transition-all ${enabled ? `bg-${color}-500/10 border-${color}-500/50 text-white` : 'bg-slate-950 border-slate-800 text-slate-500'} w-full`}>
        <div className={`p-2 rounded-md mr-3 ${enabled ? `bg-${color}-500 text-black` : 'bg-slate-900'}`}><Icon className="w-4 h-4" /></div>
        <span className="font-semibold text-sm">{label}</span>
    </button>
);*/}
                {/* Header / Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card/30 backdrop-blur-md">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {activeTab === 'brain' && 'AI Model & Brain Configuration'}
                            {activeTab === 'agent' && 'Agent Behavior & Persona'}
                            {activeTab === 'research' && 'Research Tools & Sources'}
                            {activeTab === 'channels' && 'Messaging Channels'}
                            {activeTab === 'system' && 'System Preferences'}
                            {activeTab === 'general' && 'Project & Context'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadSettings}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            title="Reload Settings"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <div className="max-w-4xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}
