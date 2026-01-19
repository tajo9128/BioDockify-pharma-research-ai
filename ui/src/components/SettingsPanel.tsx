import React, { useState, useEffect } from 'react';
import { api, Settings } from '@/lib/api';
import { AGENT_PERSONAS } from '@/lib/personas';
import { Save, Server, Cloud, Cpu, RefreshCw, CheckCircle, AlertCircle, Shield, Activity, Power, BookOpen, Layers, FileText, Globe, Database, Key, FlaskConical, Link, FolderOpen, UserCircle } from 'lucide-react';

// Extended Settings interface matching "Fully Loaded" specs + New User Requests
interface AdvancedSettings extends Omit<Settings, 'persona'> {
    // We omit persona to redefine it slightly looser if needed, or just extending is fine if we match types.
    // However, to fix the error "Interface 'AdvancedSettings' incorrectly extends interface 'Settings'",
    // we should just rely on the base Settings for common fields or fully match strictness.
    // Because Settings is providing strict types, let's allow AdvancedSettings to use those.
    system: {
        auto_start: boolean;
        minimize_to_tray: boolean;
        pause_on_battery: boolean;
        max_cpu_percent: number;
        internet_research: boolean; // NEW: Agent Zero Internet Toggle
    };
    ai_advanced: {
        context_window: number;
        gpu_layers: number;
        thread_count: number;
    };
    pharma: {
        // ... existing
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
            google_scholar: boolean;
            openalex: boolean;
            semantic_scholar: boolean;
            ieee: boolean;
            elsevier: boolean;
            scopus: boolean;
            wos: boolean;
            science_index: boolean;
        };
    };
    // Re-declare persona to match Settings but allow string for UI flexibility if needed, 
    // BUT TS requires compatibility. Best to use the Settings type.
    persona: Settings['persona'] & {
        department: string; // NEW: Department Context
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
    // Internet Research is ENABLED by default for "Agent Zero"
    const defaultSettings: AdvancedSettings = {
        project: { name: 'New Project', type: 'Drug Discovery', disease_context: 'Alzheimer\'s', stage: 'Early Discovery' },
        agent: { mode: 'assisted', reasoning_depth: 'standard', self_correction: true, max_retries: 3, failure_policy: 'ask_user' },
        literature: { sources: ['pubmed'], enable_crossref: true, enable_preprints: false, year_range: 5, novelty_strictness: 'medium' },
        system: { auto_start: false, minimize_to_tray: true, pause_on_battery: true, max_cpu_percent: 80, internet_research: true }, // DEFAULT TRUE
        ai_provider: {
            mode: 'ollama',
            ollama_url: 'http://localhost:11434',
            ollama_model: '',

            // LM Studio
            lm_studio_url: 'http://localhost:1234/v1',
            lm_studio_model: '',

            google_key: '',
            huggingface_key: '',
            openrouter_key: '',
            // Generic Custom API (formerly GLM hardcoded)
            custom_base_url: '',
            custom_key: '',
            custom_model: '',
            // SurfSense Knowledge Engine (replaces Neo4j)
            surfsense_url: 'http://localhost:3003',
            surfsense_key: '',
            surfsense_auto_start: false,

            elsevier_key: '' // Added missing key
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

    const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('brain');

    const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [connectionMsg, setConnectionMsg] = useState('');

    // API Test Status Tracking
    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
        google: 'idle',
        huggingface: 'idle',
        openrouter: 'idle',
        glm: 'idle',
        elsevier: 'idle',
        custom: 'idle'  // Added for Custom API and LM Studio tests
    });

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        try {
            const remote = await api.getSettings();
            if (remote) {
                setSettings(prev => ({
                    ...prev,
                    ...remote,
                    ai_provider: { ...prev.ai_provider, ...remote.ai_provider }, // Ensure flat merge
                    pharma: { ...prev.pharma, ...remote.pharma, sources: { ...prev.pharma.sources, ...remote.pharma?.sources } },
                    persona: { ...prev.persona, ...remote.persona }
                }));
            }
        } catch (e) {
            console.warn('Using default settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            console.log('Saving settings payload:', settings);
            await api.saveSettings(settings);
            // Force reload to verify persistence
            await loadSettings();
            alert('Settings saved successfully!');
        } catch (e) {
            console.error('Save failed:', e);
            alert('Failed to save settings. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    const checkOllamaConnection = async () => {
        if (!settings.ai_provider.ollama_url) return;
        setConnectionMsg('Pinging...');
        setOllamaStatus('unknown');
        try {
            const res = await api.checkOllama(settings.ai_provider.ollama_url);
            if (res.status === 'success') {
                setOllamaStatus('success');
                setOllamaModels(res.models || []);
                setConnectionMsg('Online');
            } else {
                setOllamaStatus('error');
                setConnectionMsg(res.message || 'Error');
            }
        } catch (e: any) {
            setOllamaStatus('error');
            setConnectionMsg(e.message || 'Failed to connect');
        }
    };

    const handleTestKey = async (provider: string, key?: string, serviceType: 'llm' | 'elsevier' = 'llm', baseUrl?: string, model?: string) => {
        console.log('[DEBUG] handleTestKey called with:', { provider, key: key ? '***' : 'missing', serviceType, baseUrl, model });
        console.log('[DEBUG] Current testStatus state:', testStatus);

        if (!key) {
            alert('Please enter an API key first.');
            return;
        }

        console.log('[DEBUG] Setting testStatus for provider:', provider, 'to testing');
        setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));

        try {
            console.log('[DEBUG] Calling api.testConnection with:', { serviceType, provider, baseUrl, model });
            const res = await api.testConnection(serviceType, provider, key, baseUrl, model);
            console.log('[DEBUG] API response:', res);

            if (res.status === 'success') {
                setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
                alert(`✅ ${res.message}`);
            } else if (res.status === 'warning') {
                setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
                alert(`⚠️ ${res.message}`);
            } else {
                setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
                alert(`❌ ${res.message}`);
            }
        } catch (e: any) {
            console.error('[DEBUG] API Test Failed with exception:', e);
            console.error('[DEBUG] Error details:', { message: e.message, stack: e.stack });
            setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
            alert(`❌ API Test Failed: ${e.message}`);
        }
    };

    const handleSettingChange = (section: keyof AdvancedSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: value
        }));
    };

    const updatePharmaSource = (key: keyof typeof settings.pharma.sources, val: boolean) => {
        setSettings({
            ...settings,
            pharma: {
                ...settings.pharma,
                sources: { ...settings.pharma.sources, [key]: val }
            }
        });
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
                <TabButton id="backup" label="Cloud Backup" icon={Cloud} />
                <TabButton id="persona" label="Persona" icon={BookOpen} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">

                    {/* TAB: AI & BRAIN (Local) */}
                    {activeTab === 'brain' && (
                        <div className="space-y-6 animate-in fade-in duration-300">

                            {/* Agent Zero Persona (Phase 6) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <UserCircle className="w-5 h-5 text-indigo-400" />
                                    Agent Zero Persona
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {AGENT_PERSONAS.map(persona => (
                                        <div
                                            key={persona.id}
                                            onClick={() => handleSettingChange('persona', { ...settings.persona, role: persona.id })}
                                            className={`cursor-pointer p-4 rounded-lg border transition-all ${settings.persona?.role === persona.id
                                                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50'
                                                : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-semibold ${settings.persona?.role === persona.id ? 'text-indigo-400' : 'text-slate-200'
                                                    }`}>
                                                    {persona.label}
                                                </span>
                                                {settings.persona?.role === persona.id && <CheckCircle className="w-4 h-4 text-indigo-500" />}
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {persona.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

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
                                            <option value="lm_studio">Local - LM Studio (Primary)</option>
                                            <option value="ollama">Local - Ollama (Legacy)</option>
                                            <option value="z-ai">Cloud Only (GLM/Google/OpenRouter)</option>
                                        </select>
                                    </div>

                                    {/* Ollama Config (Legacy) */}
                                    {settings.ai_provider.mode === 'ollama' && (
                                        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 opacity-75">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-slate-300">Ollama (Legacy)</span>
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
                                            <div className="mt-3">
                                                <label className="text-xs text-slate-500 block mb-1">Custom Model</label>
                                                <div className="flex space-x-2">
                                                    <input
                                                        value={settings.ai_provider.ollama_model}
                                                        onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, ollama_model: e.target.value } })}
                                                        placeholder="Enter model name (e.g., llama2, mistral, codellama)"
                                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-600"
                                                    />
                                                    <button
                                                        onClick={checkOllamaConnection}
                                                        className="px-4 bg-slate-800 text-white rounded-md text-xs font-medium hover:bg-slate-700"
                                                    >
                                                        Refresh
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>


                            </div>
                        </div>
                    )}

                    {/* LM Studio Config (Visible only if selected) */}
                    {settings.ai_provider.mode === 'lm_studio' && (
                        <div className="mt-4 p-4 bg-indigo-950/20 rounded-lg border border-indigo-500/30">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                                    <span className="text-sm font-bold text-indigo-300">LM Studio Configuration</span>
                                </div>
                                <a href="https://lmstudio.ai" target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-white underline">
                                    Download LM Studio
                                </a>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Local Server URL</label>
                                    <input
                                        value={settings.ai_provider.lm_studio_url || 'http://localhost:1234/v1'}
                                        onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, lm_studio_url: e.target.value } })}
                                        placeholder="http://localhost:1234/v1"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Model ID (Optional)</label>
                                    <input
                                        value={settings.ai_provider.lm_studio_model || ''}
                                        onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, lm_studio_model: e.target.value } })}
                                        placeholder="Enter Model ID (Leave empty to use loaded model)"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Recommended for 8GB RAM: <b>BioMedLM-2.7B</b> or <b>LFM-2 2.6B</b>.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleTestKey('custom', 'lm-studio', 'llm', settings.ai_provider.lm_studio_url, settings.ai_provider.lm_studio_model)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-md py-2 text-xs font-bold transition-colors"
                                >
                                    Test Connection
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB: CLOUD APIS */}
                    {activeTab === 'cloud' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Cloud className="w-5 h-5 mr-2 text-sky-400" /> External API Keys
                                </h3>
                                <div className="grid gap-4">
                                    {/* Google */}
                                    <CloudKeyBox
                                        name="Google Gemini"
                                        icon="G"
                                        modelValue={settings.ai_provider?.google_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, google_model: v } })}
                                        value={settings.ai_provider.google_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, google_key: v } })}
                                        onTest={() => handleTestKey('google', settings.ai_provider.google_key)}
                                        testStatus={testStatus.google}
                                    />
                                    {/* Hugging Face */}
                                    <CloudKeyBox
                                        name="Hugging Face Inference"
                                        icon="🤗"
                                        modelValue={settings.ai_provider?.huggingface_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, huggingface_model: v } })}
                                        value={settings.ai_provider.huggingface_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, huggingface_key: v } })}
                                        onTest={() => handleTestKey('huggingface', settings.ai_provider.huggingface_key)}
                                        testStatus={testStatus.huggingface}
                                    />
                                    {/* OpenRouter */}
                                    <CloudKeyBox
                                        name="OpenRouter"
                                        icon="OR"
                                        modelValue={settings.ai_provider?.openrouter_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openrouter_model: v } })}
                                        value={settings.ai_provider.openrouter_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openrouter_key: v } })}
                                        onTest={() => handleTestKey('openrouter', settings.ai_provider.openrouter_key)}
                                        testStatus={testStatus.openrouter}
                                    />
                                    {/* Generic Paid / Custom API */}
                                    <div className="border-t border-slate-800 my-2 pt-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className="text-xs font-bold text-yellow-500 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">PAID</span>
                                            <h4 className="text-sm font-semibold text-white">Paid API (OpenAI / Compatible)</h4>
                                        </div>
                                        <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                            {/* Base URL Input */}
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Base URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://api.openai.com/v1"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                                                    value={settings.ai_provider.custom_base_url || ''}
                                                    onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, custom_base_url: e.target.value } })}
                                                />
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    Examples: https://api.openai.com/v1, https://api.groq.com/openai/v1
                                                </p>
                                            </div>

                                            <CloudKeyBox
                                                name="API Key"
                                                icon="Key"
                                                modelValue={settings.ai_provider?.custom_model}
                                                modelPlaceholder="Model ID (e.g. gpt-4o, o1-preview)"
                                                onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, custom_model: v } })}
                                                value={settings.ai_provider.custom_key}
                                                onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, custom_key: v } })}
                                                onTest={() => handleTestKey('custom', settings.ai_provider.custom_key, 'llm', settings.ai_provider.custom_base_url, settings.ai_provider.custom_model)}
                                                testStatus={testStatus.custom}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PHARMA & SOURCES (Fixed Tab Logic + Added Sources) */}
                    {activeTab === 'pharma' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Rules */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Shield className="w-5 h-5 mr-2 text-emerald-400" /> Compliance Rules & Safety
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

                            {/* Sources Grid */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                                    <Database className="w-5 h-5 mr-2 text-cyan-400" /> Literature Sources
                                </h3>

                                <div className="space-y-8">
                                    {/* Medical & Bio */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Medical & Biology</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ToggleCard icon={Activity} label="PubMed Central" enabled={settings.pharma.sources.pmc} onClick={() => updatePharmaSource('pmc', !settings.pharma.sources.pmc)} color="blue" />
                                            <ToggleCard icon={Activity} label="ClinicalTrials.gov" enabled={settings.pharma.sources.clinicaltrials} onClick={() => updatePharmaSource('clinicaltrials', !settings.pharma.sources.clinicaltrials)} color="emerald" />
                                        </div>
                                    </div>

                                    {/* Broad Academic */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Broad Academic</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ToggleCard icon={Globe} label="Google Scholar" enabled={settings.pharma.sources.google_scholar} onClick={() => updatePharmaSource('google_scholar', !settings.pharma.sources.google_scholar)} color="sky" />
                                            <ToggleCard icon={BookOpen} label="OpenAlex (Recommended)" enabled={settings.pharma.sources.openalex} onClick={() => updatePharmaSource('openalex', !settings.pharma.sources.openalex)} color="indigo" />
                                            <ToggleCard icon={BookOpen} label="Semantic Scholar" enabled={settings.pharma.sources.semantic_scholar} onClick={() => updatePharmaSource('semantic_scholar', !settings.pharma.sources.semantic_scholar)} color="violet" />
                                            <ToggleCard icon={BookOpen} label="IEEE Xplore" enabled={settings.pharma.sources.ieee} onClick={() => updatePharmaSource('ieee', !settings.pharma.sources.ieee)} color="blue" />
                                        </div>
                                    </div>

                                    {/* Premium / Paid */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Premium Databases</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ToggleCard icon={Database} label="Elsevier ScienceDirect" enabled={settings.pharma.sources.elsevier} onClick={() => updatePharmaSource('elsevier', !settings.pharma.sources.elsevier)} color="orange" />
                                            <ToggleCard icon={Database} label="Scopus" enabled={settings.pharma.sources.scopus} onClick={() => updatePharmaSource('scopus', !settings.pharma.sources.scopus)} color="orange" />
                                            <ToggleCard icon={Database} label="Web of Science" enabled={settings.pharma.sources.wos} onClick={() => updatePharmaSource('wos', !settings.pharma.sources.wos)} color="purple" />
                                        </div>
                                        {/* API Key for Elsevier */}
                                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                            <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase">Elsevier / Scopus API Key</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    value={settings.ai_provider.elsevier_key || ''}
                                                    onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, elsevier_key: e.target.value } })}
                                                    placeholder="Enter Elsevier Dev Key"
                                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-orange-500/50 focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => handleTestKey('elsevier', settings.ai_provider.elsevier_key, 'elsevier')}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition-colors"
                                                >
                                                    Test
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: OUTPUT & SYSTEM & PERSONA (Corrected Logic) */}

                    {activeTab === 'output' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-orange-400" /> Reporting Configuration
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">Preferred Output Format</label>
                                        <div className="flex flex-wrap gap-3">
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
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { open } = await import('@tauri-apps/api/dialog');
                                                        const selected = await open({ directory: true, multiple: false });
                                                        if (selected && typeof selected === 'string') {
                                                            setSettings({ ...settings, output: { ...settings.output, output_dir: selected } });
                                                        }
                                                    } catch (e) {
                                                        console.error("Failed to open dialog", e);
                                                        alert("Could not open file browser. Are you running in Tauri?");
                                                    }
                                                }}
                                                className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm border border-slate-600"
                                            >
                                                Browse
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { Command } = await import('@tauri-apps/api/shell');
                                                        // Open folder in file explorer
                                                        await new Command('explorer', settings.output.output_dir).execute();
                                                    } catch (e) {
                                                        console.error("Failed to open folder", e);
                                                        alert("Could not open folder in file explorer.");
                                                    }
                                                }}
                                                className="px-4 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm border border-teal-600"
                                                title="Open folder in file explorer"
                                            >
                                                <FolderOpen className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Power className="w-5 h-5 mr-2 text-rose-400" /> Lifecycle Management
                                </h3>
                                <div className="space-y-4">
                                    <ToggleSetting label="Auto-Start on Boot" desc="Launch BioDockify automatically when you log in." enabled={settings.system.auto_start} onChange={() => setSettings({ ...settings, system: { ...settings.system, auto_start: !settings.system.auto_start } })} />
                                    <ToggleSetting label="Minimize to System Tray" desc="Keep agent running in background when window is closed." enabled={settings.system.minimize_to_tray} onChange={() => setSettings({ ...settings, system: { ...settings.system, minimize_to_tray: !settings.system.minimize_to_tray } })} />
                                    <ToggleSetting label="Battery Saver Mode" desc="Pause research automatically when on battery power." enabled={settings.system.pause_on_battery} onChange={() => setSettings({ ...settings, system: { ...settings.system, pause_on_battery: !settings.system.pause_on_battery } })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Backup Control Center */}
                            <CloudBackupControl />
                        </div>
                    )}

                    {activeTab === 'persona' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in duration-300">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <BookOpen className="w-5 h-5 mr-2 text-yellow-400" /> Research Persona
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">User Role</label>
                                        <select
                                            value={settings.persona?.role || 'PhD Student'}
                                            onChange={(e) => setSettings({ ...settings, persona: { ...settings.persona, role: e.target.value } })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                                        >
                                            <option value="PhD Student">PhD Student</option>
                                            <option value="PG Student">PG Student</option>
                                            <option value="Senior Researcher">Senior Researcher</option>
                                            <option value="Industry Scientist">Industry Scientist</option>
                                        </select>
                                        <p className="text-xs text-slate-500">Defines the complexity of language and assumptions made by the agent.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Strictness Level</label>
                                        <select
                                            value={settings.persona?.strictness || 'balanced'}
                                            onChange={(e) => setSettings({ ...settings, persona: { ...settings.persona, strictness: e.target.value } })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                                        >
                                            <option value="exploratory">Exploratory (Creative)</option>
                                            <option value="balanced">Balanced (Standard)</option>
                                            <option value="conservative">Conservative (High Proof)</option>
                                        </select>
                                        <p className="text-xs text-slate-500">Controls how much speculation is allowed in answers.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Start Introduction (Who are you?)</label>
                                    <textarea
                                        value={settings.persona?.introduction || ''}
                                        onChange={(e) => setSettings({ ...settings, persona: { ...settings.persona, introduction: e.target.value } })}
                                        placeholder="I am a researcher specializing in neurodegenerative diseases..."
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                                    />
                                    <p className="text-xs text-slate-500">The agent will use this context to tailor its tone and examples.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Current Work (What are you working on?)</label>
                                    <textarea
                                        value={settings.persona?.research_focus || ''}
                                        onChange={(e) => setSettings({ ...settings, persona: { ...settings.persona, research_focus: e.target.value } })}
                                        placeholder="Investigating the role of Tau proteins in early-stage Alzheimer's..."
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                                    />
                                    <p className="text-xs text-slate-500">Specific context that helps the agent prioritize relevant papers.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Department / Faculty</label>
                                    <input
                                        type="text"
                                        value={settings.persona?.department || ''}
                                        onChange={(e) => setSettings({ ...settings, persona: { ...settings.persona, department: e.target.value } })}
                                        placeholder="e.g., Pharmaceutical Sciences, Clinical Oncology, Molecular Biology"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                                    />
                                    <p className="text-xs text-slate-500">Your academic department or research unit for thesis/manuscript headers.</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Sidebar Summary & Status (Visible on Large Screens Only) */}
                <div className="space-y-6 hidden lg:block">
                    <div className="bg-teal-950/30 border border-teal-900/50 rounded-xl p-6">
                        <h4 className="text-sm font-bold text-teal-400 mb-3 uppercase tracking-wider">Active Status</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between">
                                <span className="text-slate-400">Mode</span>
                                <span className="text-white font-mono">{settings.ai_provider?.mode?.toUpperCase()}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Export</span>
                                <span className="text-white font-mono">{settings.output?.format?.toUpperCase()}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Cloud Keys</span>
                                <span className="text-white font-mono">
                                    {/* Updated to use ai_provider keys */}
                                    {[settings.ai_provider?.google_key, settings.ai_provider?.huggingface_key, settings.ai_provider?.glm_key].filter(k => k).length} Active
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Role</span>
                                <span className="text-white font-mono truncate max-w-[100px]">{settings.persona?.role}</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- Helper Components ---

const CloudKeyBox = ({ name, value, icon, onChange, onTest, testStatus = 'idle', modelValue, onModelChange, modelPlaceholder, ...props }: any) => {
    const getStatusIcon = () => {
        switch (testStatus) {
            case 'testing':
                return <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />;
            case 'success':
                return <CheckCircle className="w-3 h-3 text-green-400" />;
            case 'error':
                return <AlertCircle className="w-3 h-3 text-red-400" />;
            default:
                return null;
        }
    };

    const getStatusBorder = () => {
        switch (testStatus) {
            case 'testing':
                return 'border-blue-500/50';
            case 'success':
                return 'border-green-500/50';
            case 'error':
                return 'border-red-500/50';
            default:
                return 'border-slate-800';
        }
    };

    return (
        <div className={`p-4 bg-slate-950 rounded-lg border ${getStatusBorder()} transition-colors`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">{icon}</span>
                    <span className="text-sm font-medium text-slate-300">{name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    {getStatusIcon()}
                </div>
            </div>
            <div className="flex space-x-2">
                <input
                    type="password"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-teal-500/50 focus:outline-none"
                />
                <button
                    onClick={onTest}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition-colors"
                >
                    Test
                </button>
            </div>
            {/* Model ID Input (Optional) */}
            {onModelChange && (
                <div className="mt-3">
                    <label className="text-xs text-slate-500 block mb-1">Model ID (Optional - Overrides Default)</label>
                    <input
                        type="text"
                        value={modelValue || ''}
                        onChange={(e) => onModelChange(e.target.value)}
                        placeholder={modelPlaceholder || "Default Model"}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-teal-500/50 focus:outline-none"
                    />
                </div>
            )}
        </div>
    );
};

// --- Cloud Backup Component ---
const CloudBackupControl = () => {
    const [status, setStatus] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [authCode, setAuthCode] = useState(''); // For MVP manual paste if needed, though we simulate window open

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const s = await api.backup.getStatus();
            setStatus(s);
            if (s.connected) {
                const h = await api.backup.getHistory();
                setHistory(h);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSignIn = async () => {
        try {
            setLoading(true);
            const { url } = await api.backup.getAuthUrl();
            // Open in new window
            window.open(url, '_blank', 'width=500,height=600');
            // In a real app, we'd listen for a callback or have a deep link. 
            // For this simulated flow, we ask the user to verify (or paste code if we displayed it).
            // But our mock backend accepts "simulated_valid_code_123".
            setError("Close the popup after signing in. (Simulation: Enter 'simulated_valid_code_123' below)");
        } catch (e: any) {
            setError("Failed to start auth: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!authCode) return;
        setVerifying(true);
        try {
            await api.backup.verifyAuth(authCode);
            await fetchStatus();
            setError('');
            setAuthCode('');
            alert("Successfully connected to BioDockify Cloud Drive!");
        } catch (e: any) {
            setError("Verification failed: " + e.message);
        } finally {
            setVerifying(false);
        }
    };

    const handleBackupNow = async () => {
        if (!confirm("Start backup now? This may take a few moments.")) return;
        try {
            setLoading(true);
            await api.backup.runBackup();
            alert("Backup Initiated in Background");
            // Refresh history after delay
            setTimeout(fetchStatus, 2000);
        } catch (e: any) {
            alert("Backup Failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        if (!confirm("⚠️ RESTORE WARNING: This will overwrite local research files. Are you sure?")) return;
        try {
            setLoading(true);
            await api.backup.restore(id);
            alert("Restore Complete! Please restart the application.");
        } catch (e: any) {
            alert("Restore Failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (status?.connected) {
        return (
            <div className="space-y-6">
                <div className="bg-emerald-950/30 border border-emerald-900 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-900/50 rounded-full">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Active Backup</h3>
                                <p className="text-sm text-emerald-400 font-mono">{status.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleBackupNow}
                            disabled={loading}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                        >
                            {loading ? 'Running...' : 'Backup Now'}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Snapshots</h4>
                    {history.length === 0 ? (
                        <p className="text-slate-500">No backups found.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-800 rounded">
                                            <Database className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm text-slate-200">{item.name}</p>
                                            <p className="text-xs text-slate-500">{new Date(item.created_time).toLocaleString()} • {(item.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(item.id)}
                                        className="text-xs font-bold text-teal-500 hover:text-teal-400 px-3 py-1.5 bg-teal-950/50 hover:bg-teal-900 rounded border border-teal-900 transition-colors"
                                    >
                                        RESTORE
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Cloud className="w-8 h-8 text-slate-400" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-white mb-2">Initialize Cloud Backup</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                    Securely backup your research data, personas, and settings to Google Drive.
                    BioDockify encrypts all data before upload.
                </p>
            </div>

            <div className="max-w-xs mx-auto space-y-4">
                <button
                    onClick={handleSignIn}
                    className="w-full py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                    Sign in with BioDockify
                </button>
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-400">
                        {error}
                        {/* Simulation Input */}
                        <div className="mt-2 flex gap-2">
                            <input
                                value={authCode}
                                onChange={e => setAuthCode(e.target.value)}
                                placeholder="Paste Code (simulated_valid_code_123)"
                                className="flex-1 bg-black/30 rounded px-2 py-1 text-white border border-red-800/50"
                            />
                            <button onClick={handleVerify} className="px-2 bg-red-800 text-white rounded font-bold">OK</button>
                        </div>
                    </div>
                )}
                <p className="text-xs text-slate-600">
                    By signing in, you agree to enable access to your specific research app folder (drive.file).
                </p>
            </div>
        </div>
    );
};

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

const ToggleCard = ({ icon: Icon, label, enabled, onClick, color = 'teal' }: any) => {
    const activeClass = enabled
        ? `bg-${color}-500/10 border-${color}-500 text-white`
        : 'bg-slate-950 border-slate-800 text-slate-500';

    return (
        <button
            onClick={onClick}
            className={`flex items-center p-3 rounded-lg border transition-all ${activeClass} hover:border-slate-700 w-full`}
        >
            <div className={`p-2 rounded-md mr-3 ${enabled ? `bg-${color}-500 text-black` : 'bg-slate-900'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">{label}</span>
            {enabled && <CheckCircle className={`ml-auto w-4 h-4 text-${color}-500`} />}
        </button>
    );
};
