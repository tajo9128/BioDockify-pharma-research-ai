import React, { useState, useEffect } from 'react';
import { api, Settings } from '@/lib/api';
import { Save, Server, Cloud, Cpu, RefreshCw, CheckCircle, AlertCircle, Shield, Activity, Power, BookOpen, Layers, FileText, Globe, Database, Key } from 'lucide-react';

// Extended Settings interface matching "Fully Loaded" specs + New User Requests
interface AdvancedSettings extends Settings {
    system: {
        auto_start: boolean;
        minimize_to_tray: boolean;
        pause_on_battery: boolean;
        max_cpu_percent: number;
    };
    ai_advanced: {
        context_window: number;
        gpu_layers: number;
        thread_count: number;
    };
    ai_cloud: {
        google_key: string;
        huggingface_key: string;
        openrouter_key: string;
        glm_key: string; // Specific request for GLM 4.7
    };
    pharma: {
        enable_pubtator: boolean;
        enable_semantic_scholar: boolean;
        enable_unpaywall: boolean;
        citation_threshold: 'low' | 'medium' | 'high';
        sources: {
            pubmed: boolean;
            pmc: boolean;
            biorxiv: boolean;
            chemrxiv: boolean;
            clinicaltrials: boolean;
        };
    };
    persona: {
        role: 'PhD Student' | 'Senior Researcher' | 'Industry Scientist';
        strictness: 'exploratory' | 'balanced' | 'conservative';
    };
    output: {
        format: 'markdown' | 'pdf' | 'docx' | 'latex';
        citation_style: 'apa' | 'nature' | 'ieee' | 'chicago';
        include_disclosure: boolean;
        output_dir: string;
    };
}

export default function SettingsPanel() {
    // Default State with ALL features
    const defaultSettings: AdvancedSettings = {
        project: { name: 'New Project', type: 'Drug Discovery', disease_context: 'Alzheimer\'s', stage: 'Early Discovery' },
        agent: { mode: 'assisted', reasoning_depth: 'standard', self_correction: true, max_retries: 3, failure_policy: 'ask_user' },
        literature: { sources: ['pubmed'], enable_crossref: true, enable_preprints: false, year_range: 5, novelty_strictness: 'medium' },
        ai_provider: { mode: 'auto', ollama_url: 'http://localhost:11434', ollama_model: 'llama2' },

        system: { auto_start: true, minimize_to_tray: true, pause_on_battery: true, max_cpu_percent: 80 },
        ai_advanced: { context_window: 8192, gpu_layers: -1, thread_count: 8 },
        ai_cloud: { google_key: '', huggingface_key: '', openrouter_key: '', glm_key: '' },
        pharma: {
            enable_pubtator: true, enable_semantic_scholar: true, enable_unpaywall: true, citation_threshold: 'high',
            sources: { pubmed: true, pmc: true, biorxiv: false, chemrxiv: false, clinicaltrials: true }
        },
        persona: { role: 'PhD Student', strictness: 'conservative' },
        output: { format: 'markdown', citation_style: 'apa', include_disclosure: true, output_dir: 'C:\\Research\\Exports' }
    };

    const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('brain');

    const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [connectionMsg, setConnectionMsg] = useState('');

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        try {
            const remote = await api.getSettings();
            if (remote) setSettings({ ...defaultSettings, ...remote });
        } catch (e) {
            console.warn('Using default settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.saveSettings(settings);
            alert('Settings saved successfully!');
        } catch (e) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // ... checkOllamaConnection (same as before) ...
    const checkOllamaConnection = async () => {
        if (!settings.ai_provider.ollama_url) return;
        setConnectionMsg('Pinging...');
        setOllamaStatus('unknown');
        try {
            const res = await api.checkOllama(settings.ai_provider.ollama_url);
            if (res.status === 'ok') {
                setOllamaStatus('success');
                setOllamaModels(res.models || []);
                setConnectionMsg('Online');
            } else {
                setOllamaStatus('error');
                setConnectionMsg(res.message || 'Error');
            }
        } catch (e: any) {
            setOllamaStatus('error');
            setConnectionMsg(e.message || 'Failed');
        }
    };


    if (loading) return <div className="p-12 text-center text-slate-400">Loading Configuration...</div>;

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all min-w-max ${activeTab === id
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur z-10 py-4 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <Layers className="w-6 h-6 mr-3 text-teal-500" />
                    Agent Configuration
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2 rounded-lg font-bold shadow-lg shadow-teal-500/10 disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
                <TabButton id="brain" label="AI & Brain" icon={Cpu} />
                <TabButton id="cloud" label="Cloud APIs" icon={Cloud} />
                <TabButton id="pharma" label="Pharma & Sources" icon={Database} />
                <TabButton id="output" label="Output & Reports" icon={FileText} />
                <TabButton id="system" label="System" icon={Power} />
                <TabButton id="persona" label="Persona" icon={BookOpen} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">

                    {/* TAB: AI & BRAIN (Local) */}
                    {activeTab === 'brain' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Server className="w-5 h-5 mr-2 text-blue-400" /> Primary Provider
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Provider Strategy</label>
                                        <select
                                            value={settings.ai_provider.mode}
                                            onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, mode: e.target.value as any } })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-teal-500"
                                        >
                                            <option value="auto">Auto (Local First, Cloud Fallback)</option>
                                            <option value="ollama">Local Only (Privacy Focused)</option>
                                            <option value="z-ai">Cloud Only (GLM/Google/OpenRouter)</option>
                                        </select>
                                    </div>

                                    {/* Ollama Config */}
                                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-300">Local Inference Engine</span>
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${ollamaStatus === 'success' ? 'bg-green-500' : ollamaStatus === 'error' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                                <span className="text-xs text-slate-500">{connectionMsg || 'Unknown'}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <input
                                                value={settings.ai_provider.ollama_url}
                                                onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, ollama_url: e.target.value } })}
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white"
                                            />
                                            <button onClick={checkOllamaConnection} className="px-4 bg-slate-800 text-white rounded-md text-xs font-medium hover:bg-slate-700">Check</button>
                                        </div>

                                        {ollamaModels.length > 0 && (
                                            <div className="mt-3">
                                                <label className="text-xs text-slate-500 block mb-1">Active Model</label>
                                                <select
                                                    value={settings.ai_provider.ollama_model}
                                                    onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, ollama_model: e.target.value } })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white"
                                                >
                                                    {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Cpu className="w-5 h-5 mr-2 text-purple-400" /> Hardware Acceleration
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Context Window</label>
                                        <select
                                            value={settings.ai_advanced.context_window}
                                            onChange={(e) => setSettings({ ...settings, ai_advanced: { ...settings.ai_advanced, context_window: parseInt(e.target.value) } })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                                        >
                                            <option value={4096}>4,096 (Standard)</option>
                                            <option value={8192}>8,192 (Extended)</option>
                                            <option value={16384}>16,384 (Large - High RAM)</option>
                                            <option value={32768}>32,768 (Massive - 24GB+ VRAM)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">GPU Layers Offload</label>
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="range" min="-1" max="100"
                                                value={settings.ai_advanced.gpu_layers}
                                                onChange={(e) => setSettings({ ...settings, ai_advanced: { ...settings.ai_advanced, gpu_layers: parseInt(e.target.value) } })}
                                                className="flex-1 accent-teal-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="text-sm font-mono text-teal-400">{settings.ai_advanced.gpu_layers === -1 ? 'ALL' : settings.ai_advanced.gpu_layers}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Slider: -1 (All) to 100 layers.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: CLOUD APIS (User Request 3-Box + GLM) */}
                    {activeTab === 'cloud' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Cloud className="w-5 h-5 mr-2 text-sky-400" /> External API Keys
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Configure fallback or primary cloud providers. Agent will prioritize these over local models if "Cloud Only" is selected or local fails.
                                </p>

                                <div className="grid gap-4">
                                    {/* Google */}
                                    <CloudKeyBox
                                        name="Google Gemini"
                                        icon="G"
                                        value={settings.ai_cloud.google_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_cloud: { ...settings.ai_cloud, google_key: v } })}
                                    />
                                    {/* Hugging Face */}
                                    <CloudKeyBox
                                        name="Hugging Face Inference"
                                        icon="🤗"
                                        value={settings.ai_cloud.huggingface_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_cloud: { ...settings.ai_cloud, huggingface_key: v } })}
                                    />
                                    {/* OpenRouter */}
                                    <CloudKeyBox
                                        name="OpenRouter"
                                        icon="OR"
                                        value={settings.ai_cloud.openrouter_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_cloud: { ...settings.ai_cloud, openrouter_key: v } })}
                                    />
                                    {/* GLM 4.7 (Paid) */}
                                    <div className="border-t border-slate-800 my-2 pt-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className="text-xs font-bold text-yellow-500 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">PAID</span>
                                            <h4 className="text-sm font-semibold text-white">ZhipuGLM (GLM-4.7)</h4>
                                        </div>
                                        <CloudKeyBox
                                            name="GLM-4.7 API Key"
                                            icon="Z"
                                            value={settings.ai_cloud.glm_key}
                                            onChange={(v: string) => setSettings({ ...settings, ai_cloud: { ...settings.ai_cloud, glm_key: v } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PHARMA & SOURCES */}
                    {activeTab === 'pharma' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Rules */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Shield className="w-5 h-5 mr-2 text-emerald-400" /> Compliance Rules
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">Citation Lock</h4>
                                            <p className="text-xs text-slate-400">Block outputs unsupported by sufficient evidence.</p>
                                        </div>
                                        <select
                                            value={settings.pharma.citation_threshold}
                                            onChange={(e) => setSettings({ ...settings, pharma: { ...settings.pharma, citation_threshold: e.target.value as any } })}
                                            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-1"
                                        >
                                            <option value="low">Low (1+ Source)</option>
                                            <option value="medium">Standard (3+ Sources)</option>
                                            <option value="high">Strict (5+ Sources)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Sources Selection */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Globe className="w-5 h-5 mr-2 text-blue-400" /> Literature Sources
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <ToggleCheckbox
                                        label="PubMed / MEDLINE"
                                        checked={settings.pharma.sources.pubmed}
                                        onChange={() => setSettings({ ...settings, pharma: { ...settings.pharma, sources: { ...settings.pharma.sources, pubmed: !settings.pharma.sources.pubmed } } })}
                                    />
                                    <ToggleCheckbox
                                        label="PubMed Central (Full Text)"
                                        checked={settings.pharma.sources.pmc}
                                        onChange={() => setSettings({ ...settings, pharma: { ...settings.pharma, sources: { ...settings.pharma.sources, pmc: !settings.pharma.sources.pmc } } })}
                                    />
                                    <ToggleCheckbox
                                        label="ClinicalTrials.gov"
                                        checked={settings.pharma.sources.clinicaltrials}
                                        onChange={() => setSettings({ ...settings, pharma: { ...settings.pharma, sources: { ...settings.pharma.sources, clinicaltrials: !settings.pharma.sources.clinicaltrials } } })}
                                    />
                                    <ToggleCheckbox
                                        label="bioRxiv (Preprints)"
                                        checked={settings.pharma.sources.biorxiv}
                                        onChange={() => setSettings({ ...settings, pharma: { ...settings.pharma, sources: { ...settings.pharma.sources, biorxiv: !settings.pharma.sources.biorxiv } } })}
                                    />
                                    <ToggleCheckbox
                                        label="ChemRxiv (Chemistry)"
                                        checked={settings.pharma.sources.chemrxiv}
                                        onChange={() => setSettings({ ...settings, pharma: { ...settings.pharma, sources: { ...settings.pharma.sources, chemrxiv: !settings.pharma.sources.chemrxiv } } })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: OUTPUT & REPORTS */}
                    {activeTab === 'output' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-orange-400" /> Reporting Configuration
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">Preferred Output Format</label>
                                        <div className="flex space-x-3">
                                            {['markdown', 'pdf', 'docx', 'latex'].map((fmt) => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setSettings({ ...settings, output: { ...settings.output, format: fmt as any } })}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all border ${settings.output.format === fmt
                                                            ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                                                            : 'bg-slate-950 border-slate-700 text-slate-500 hover:text-white'
                                                        }`}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Citation Style</label>
                                        <select
                                            value={settings.output.citation_style}
                                            onChange={(e) => setSettings({ ...settings, output: { ...settings.output, citation_style: e.target.value as any } })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                                        >
                                            <option value="apa">APA 7th Edition (Author, Date)</option>
                                            <option value="nature">Nature (Superscript Numbered)</option>
                                            <option value="ieee">IEEE [1]</option>
                                            <option value="chicago">Chicago Manual of Style</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Output Directory</label>
                                        <div className="flex space-x-2">
                                            <input
                                                value={settings.output.output_dir}
                                                onChange={(e) => setSettings({ ...settings, output: { ...settings.output, output_dir: e.target.value } })}
                                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono text-sm"
                                            />
                                            <button className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm border border-slate-600">Browse</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SYSTEM */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Power className="w-5 h-5 mr-2 text-rose-400" /> Lifecycle Management
                                </h3>
                                <div className="space-y-4">
                                    <ToggleSetting
                                        label="Auto-Start on Boot"
                                        desc="Launch BioDockify automatically when you log in."
                                        enabled={settings.system.auto_start}
                                        onChange={() => setSettings({ ...settings, system: { ...settings.system, auto_start: !settings.system.auto_start } })}
                                    />
                                    <ToggleSetting
                                        label="Minimize to System Tray"
                                        desc="Keep agent running in background when window is closed."
                                        enabled={settings.system.minimize_to_tray}
                                        onChange={() => setSettings({ ...settings, system: { ...settings.system, minimize_to_tray: !settings.system.minimize_to_tray } })}
                                    />
                                    <ToggleSetting
                                        label="Battery Saver Mode"
                                        desc="Pause research automatically when on battery power."
                                        enabled={settings.system.pause_on_battery}
                                        onChange={() => setSettings({ ...settings, system: { ...settings.system, pause_on_battery: !settings.system.pause_on_battery } })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PERSONA */}
                    {activeTab === 'persona' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in duration-300">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <BookOpen className="w-5 h-5 mr-2 text-yellow-400" /> Research Persona
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">User Role</label>
                                    {/* ... Same as before ... */}
                                    <select
                                        value={settings.persona.role}
                                        onChange={(e) => setSettings({ ...settings, persona: { ...settings.persona, role: e.target.value as any } })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                                    >
                                        <option>PhD Student</option>
                                        <option>Senior Researcher</option>
                                        <option>Industry Scientist</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Sidebar Summary & Status */}
                <div className="space-y-6">
                    <div className="bg-teal-950/30 border border-teal-900/50 rounded-xl p-6">
                        <h4 className="text-sm font-bold text-teal-400 mb-3 uppercase tracking-wider">Active Status</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between">
                                <span className="text-slate-400">Mode</span>
                                <span className="text-white font-mono">{settings.ai_provider.mode.toUpperCase()}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Export</span>
                                <span className="text-white font-mono">{settings.output.format.toUpperCase()}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Cloud Keys</span>
                                <span className="text-white font-mono">
                                    {[settings.ai_cloud.google_key, settings.ai_cloud.huggingface_key, settings.ai_cloud.glm_key].filter(k => k).length} Active
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- Helper Components ---

const CloudKeyBox = ({ name, value, icon, onChange }: any) => (
    <div className="flex items-center space-x-3 p-3 bg-slate-950 border border-slate-800 rounded-lg group focus-within:border-teal-500 transition-colors">
        <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center font-bold text-slate-400 border border-slate-800 group-focus-within:text-teal-400 group-focus-within:border-teal-500/50">
            {icon}
        </div>
        <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">{name}</div>
            <div className="flex space-x-2">
                <input
                    type="password"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-700 outline-none font-mono"
                />
                <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300 transition-colors">Test</button>
            </div>
        </div>
    </div>
);

const ToggleSetting = ({ label, desc, enabled, onChange }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
        <div>
            <h4 className="text-sm font-semibold text-white">{label}</h4>
            <p className="text-xs text-slate-400">{desc}</p>
        </div>
        <button
            onClick={onChange}
            className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-teal-500' : 'bg-slate-700'}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
    </div>
);

const ToggleCheckbox = ({ label, checked, onChange }: any) => (
    <div
        onClick={onChange}
        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-teal-500/10 border-teal-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
    >
        <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-teal-500 border-teal-500' : 'bg-slate-900 border-slate-600'
            }`}>
            {checked && <CheckCircle className="w-3 h-3 text-slate-950" />}
        </div>
        <span className={`text-sm font-medium ${checked ? 'text-teal-400' : 'text-slate-400'}`}>{label}</span>
    </div>
);
