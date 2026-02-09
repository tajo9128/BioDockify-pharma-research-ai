import React, { useState, useEffect } from 'react';
import { api, Settings } from '@/lib/api';
import { AGENT_PERSONAS } from '@/lib/personas';
import ChannelsSettingsPanel from './ChannelsSettingsPanel';
import { useToast } from '@/hooks/use-toast';
import { Save, Server, Cloud, Cpu, RefreshCw, CheckCircle, AlertCircle, Shield, Activity, Power, BookOpen, Layers, FileText, Globe, Database, Key, FlaskConical, Link, FolderOpen, UserCircle, Lock, Unlock, Sparkles, Wrench, MessageCircle, Search, Bot } from 'lucide-react';


// Extended Settings interface matching "Fully Loaded" specs + New User Requests
// Use Settings from api.ts directly or extend if necessary
type AdvancedSettings = Settings;

export default function SettingsPanel() {
    const { toast } = useToast();
    // Default State with ALL features
    const defaultSettings: AdvancedSettings = {
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
        literature: { sources: ['pubmed'], enable_crossref: true, enable_preprints: false, year_range: 5, novelty_strictness: 'medium', grobid_url: 'http://localhost:8070' },
        system: { max_cpu_percent: 80, internet_research: true, auto_update: true, log_level: 'INFO' },
        ai_provider: {
            mode: 'lm_studio',
            lm_studio_url: 'http://localhost:1234/v1/models',
            lm_studio_model: '',
            google_key: '',
            google_model: '',
            huggingface_key: '',
            huggingface_model: '',
            openrouter_key: '',
            openrouter_model: '',
            groq_key: '',
            groq_model: 'llama-3.3-70b-versatile',
            openai_key: '',
            openai_model: '',
            anthropic_key: '',
            anthropic_model: '',
            deepseek_key: '',
            deepseek_model: '',
            glm_key: '',
            glm_model: '',
            kimi_key: '',
            kimi_model: '',
            custom_base_url: '',
            custom_key: '',
            custom_model: '',
            surfsense_url: 'http://localhost:3003',
            surfsense_key: '',
            surfsense_auto_start: false,
            elsevier_key: '',
            semantic_scholar_key: '',
            brave_key: '',
            serper_key: '',
            jina_key: '',
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

    const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('brain');

    const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);

    const [connectionMsg, setConnectionMsg] = useState('');
    const [availableModels, setAvailableModels] = useState<{ id: string }[]>([]);

    // API Test Status Tracking
    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
        google: 'idle',
        huggingface: 'idle',
        openrouter: 'idle',
        groq: 'idle',
        deepseek: 'idle',
        glm: 'idle',
        kimi: 'idle',
        openai: 'idle',
        elsevier: 'idle',
        custom: 'idle',
        brave: 'idle',
        serper: 'idle',
        jina: 'idle',
        bohrium: 'idle'
    });

    // LM Studio Test State with Progress
    const [lmStudioTest, setLmStudioTest] = useState<{
        status: 'idle' | 'testing' | 'success' | 'error';
        progress: number;
        message: string;
        details: string;
    }>({
        status: 'idle',
        progress: 0,
        message: '',
        details: ''
    });

    // Auto-Configuration State
    const [isAutoConfigured, setIsAutoConfigured] = useState(false);

    // API Test Progress State (for all cloud APIs)
    const [apiTestProgress, setApiTestProgress] = useState<Record<string, {
        status: 'idle' | 'testing' | 'success' | 'error';
        progress: number;
        message: string;
        details: string;
    }>>({
        google: { status: 'idle', progress: 0, message: '', details: '' },
        huggingface: { status: 'idle', progress: 0, message: '', details: '' },
        openrouter: { status: 'idle', progress: 0, message: '', details: '' },
        groq: { status: 'idle', progress: 0, message: '', details: '' },
        deepseek: { status: 'idle', progress: 0, message: '', details: '' },
        glm: { status: 'idle', progress: 0, message: '', details: '' },
        kimi: { status: 'idle', progress: 0, message: '', details: '' },
        openai: { status: 'idle', progress: 0, message: '', details: '' },
        elsevier: { status: 'idle', progress: 0, message: '', details: '' },
        custom: { status: 'idle', progress: 0, message: '', details: '' },
        brave: { status: 'idle', progress: 0, message: '', details: '' },
        serper: { status: 'idle', progress: 0, message: '', details: '' },
        jina: { status: 'idle', progress: 0, message: '', details: '' },
        bohrium: { status: 'idle', progress: 0, message: '', details: '' }
    });

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        try {
            let localSettings: any = null;
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem('biodockify_settings');
                if (cached) {
                    try {
                        localSettings = JSON.parse(cached);
                    } catch (e) {
                        console.warn('[Settings] Failed to parse localStorage cache');
                    }
                }

                const firstRunUrl = localStorage.getItem('biodockify_lm_studio_url');
                const firstRunModel = localStorage.getItem('biodockify_lm_studio_model');
                const firstRunMode = localStorage.getItem('biodockify_ai_mode');

                if (firstRunUrl || firstRunModel || firstRunMode) {
                    if (!localSettings) localSettings = {};
                    if (!localSettings.ai_provider) localSettings.ai_provider = {};
                    if (firstRunUrl) localSettings.ai_provider.lm_studio_url = firstRunUrl;
                    if (firstRunModel) localSettings.ai_provider.lm_studio_model = firstRunModel;
                    if (firstRunMode) localSettings.ai_provider.mode = firstRunMode;
                }
            }

            if (localSettings) {
                setSettings(prev => ({
                    ...prev,
                    ...localSettings,
                    ai_provider: { ...prev.ai_provider, ...localSettings.ai_provider },
                    pharma: { ...prev.pharma, ...localSettings.pharma, sources: { ...prev.pharma.sources, ...localSettings.pharma?.sources } },
                    persona: { ...prev.persona, ...localSettings.persona },
                    system: { ...prev.system, ...localSettings.system }
                }));

                if (typeof window !== 'undefined') {
                    const autoConfigured = localStorage.getItem('biodockify_lm_studio_auto_configured');
                    if (autoConfigured === 'true') setIsAutoConfigured(true);
                }
            }

            if (!localSettings) {
                try {
                    const remote = await api.getSettings();
                    if (remote) {
                        setSettings(prev => ({
                            ...prev,
                            ...remote,
                            ai_provider: { ...prev.ai_provider, ...remote.ai_provider },
                            pharma: { ...prev.pharma, ...remote.pharma, sources: { ...prev.pharma.sources, ...remote.pharma?.sources } },
                            persona: { ...prev.persona, ...remote.persona },
                            system: { ...prev.system, ...remote.system }
                        }));
                    }
                } catch (e) {
                    console.log('[Settings] API unavailable, using defaults');
                    toast({
                        title: "Offline Mode",
                        description: "Could not reach backend. Using local settings.",
                        variant: "destructive"
                    });
                }
            }
        } catch (e) {
            console.warn('Using default settings - all sources unavailable');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        let apiError = null;
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('biodockify_settings', JSON.stringify(settings));
                localStorage.setItem('biodockify_first_run_complete', 'true');
            } catch (e) {
                console.error('LocalStorage save failed:', e);
            }
        }
        try {
            await api.saveSettings(settings);
        } catch (e: any) {
            console.warn('Backend sync failed:', e);
            apiError = e.message || 'Connection failed';
        }
        setSaving(false);
        if (apiError) {
            toast({
                title: "Partial Save",
                description: `Settings saved locally, but backend sync failed: ${apiError}`,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Success",
                description: "All settings saved and synchronized.",
            });
        }
        await loadSettings();
    };

    const handleTestLmStudio = async () => {
        const rawUrl = (settings.ai_provider.lm_studio_url || 'http://localhost:1234/v1/models').replace(/\/$/, '');
        const baseUrl = rawUrl.replace(/\/models\/?$/, '');
        const modelsUrl = `${baseUrl}/models`;

        setLmStudioTest({
            status: 'testing',
            progress: 10,
            message: 'Connecting to LM Studio...',
            details: `Testing ${modelsUrl}`
        });

        // Helper to delay
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            const { universalFetch } = await import('@/lib/services/universal-fetch');

            // 1. Initial Connection Attempt
            let modelsRes;
            try {
                modelsRes = await universalFetch(modelsUrl, { method: 'GET', timeout: 3000 });
            } catch (e) {
                // Connection failed - Try Auto-Start
                setLmStudioTest(prev => ({ ...prev, progress: 30, message: 'LM Studio not detected. Attempting Auto-Start...', details: 'Launching application...' }));

                try {
                    const startRes = await api.diagnoseLmStudio();
                    if (startRes.success) {
                        setLmStudioTest(prev => ({ ...prev, progress: 50, message: 'LM Studio launching...', details: 'Waiting for initialization (15s)...' }));
                        await wait(15000); // Wait 15s for startup

                        // Retry connection
                        setLmStudioTest(prev => ({ ...prev, progress: 70, message: 'Retrying connection...', details: 'Verifying startup...' }));
                        modelsRes = await universalFetch(modelsUrl, { method: 'GET', timeout: 5000 });
                    } else {
                        throw new Error(startRes.message || 'Auto-start failed');
                    }
                } catch (startErr: any) {
                    throw new Error(`Auto-start failed: ${startErr.message || 'Could not launch LM Studio'}`);
                }
            }

            if (!modelsRes || !modelsRes.ok) throw new Error(`Server returned ${modelsRes?.status || 'Error'}`);

            const modelsData = await modelsRes.json();
            const models = modelsData?.data || [];
            if (models.length === 0) {
                setLmStudioTest({ status: 'error', progress: 100, message: 'FAILED: No model loaded', details: 'Server running but no model is loaded.' });
                return;
            }

            setAvailableModels(models);
            const modelId = models[0]?.id || 'unknown';

            setLmStudioTest(prev => ({ ...prev, progress: 85, message: `Verifying model response...` }));

            const testRes = await universalFetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 }),
                timeout: 10000
            });

            if (!testRes.ok) throw new Error(`Model test failed: HTTP ${testRes.status}`);

            setLmStudioTest({ status: 'success', progress: 100, message: 'PASSED: LM Studio Connected', details: `Ready with ${modelId}` });
        } catch (e: any) {
            setLmStudioTest({ status: 'error', progress: 100, message: 'FAILED: Connection Error', details: e.message });
        }
    };

    const handleTestKey = async (provider: string, key?: string, serviceType: 'llm' | 'elsevier' | 'bohrium' | 'brave' = 'llm', baseUrl?: string, model?: string) => {
        if (!key) return;
        // Consolidate state updates to prevent race conditions
        const updateProgress = (updates: any) => {
            setApiTestProgress(prev => ({ ...prev, [provider]: { ...prev[provider], ...updates } }));
            if (updates.status) setTestStatus(prev => ({ ...prev, [provider]: updates.status }));
        };

        updateProgress({ status: 'testing', progress: 20, message: 'Testing...', details: '' });

        try {
            const result = await api.testConnection(serviceType, provider, key, provider === 'custom' ? baseUrl : undefined, model);
            if (result.status === 'success') {
                updateProgress({ status: 'success', progress: 100, message: 'PASSED', details: result.message });
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            updateProgress({ status: 'error', progress: 100, message: 'FAILED', details: err.message });
        }
    };

    const handleSettingChange = (section: keyof AdvancedSettings, value: any) => {
        setSettings(prev => ({ ...prev, [section]: value }));
    };

    const updatePharmaSource = (key: keyof typeof settings.pharma.sources, val: boolean) => {
        // Safe nested update with null checks
        setSettings(prev => ({
            ...prev,
            pharma: {
                ...prev.pharma,
                sources: {
                    ...(prev.pharma?.sources || {}),
                    [key]: val
                }
            }
        }));
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
                    BioDockify AI Configuration
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
                <TabButton id="channels" label="Channels" icon={Globe} />
                <TabButton id="pharma" label="Pharma & Sources" icon={Database} />
                <TabButton id="search" label="Search & Knowledge" icon={Search} />
                <TabButton id="backup" label="Cloud Backup" icon={Cloud} />
                <TabButton id="persona" label="Persona" icon={BookOpen} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">

                    {/* TAB: AI & BRAIN */}
                    {activeTab === 'brain' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <UserCircle className="w-5 h-5 text-indigo-400" /> BioDockify AI Persona
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {AGENT_PERSONAS.map(persona => (
                                        <div
                                            key={persona.id}
                                            onClick={() => handleSettingChange('persona', { ...settings.persona, role: persona.id })}
                                            className={`cursor-pointer p-4 rounded-lg border transition-all ${settings.persona?.role === persona.id ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-semibold ${settings.persona?.role === persona.id ? 'text-indigo-400' : 'text-slate-200'}`}>{persona.label}</span>
                                                {settings.persona?.role === persona.id && <CheckCircle className="w-4 h-4 text-indigo-500" />}
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">{persona.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Bot className="w-5 h-5 mr-2 text-teal-400" /> BioDockify AI Orchestration
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                        <div className="flex-1 pr-4">
                                            <h4 className="text-sm font-bold text-white mb-1">Human Approval Gates</h4>
                                            <p className="text-xs text-slate-500">BioDockify AI must ask for permission before critical actions.</p>
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, agent: { ...settings.agent, human_approval_gates: !settings.agent?.human_approval_gates } })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.agent?.human_approval_gates ? 'bg-teal-600' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.agent?.human_approval_gates ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Globe className="w-3 h-3" /> BioDockify AI Browser</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-300">Headless Mode</span>
                                                <button onClick={() => setSettings({ ...settings, nanobot: { ...settings.nanobot!, headless_browser: !settings.nanobot?.headless_browser } })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.nanobot?.headless_browser ? 'bg-emerald-600' : 'bg-slate-700'}`}><span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.nanobot?.headless_browser ? 'translate-x-5' : 'translate-x-1'}`} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Activity className="w-3 h-3" /> Execution Limits</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-300">Max Runtime</span>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" value={settings.agent?.max_runtime_minutes || 45} onChange={(e) => setSettings({ ...settings, agent: { ...settings.agent, max_runtime_minutes: parseInt(e.target.value) } })} className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-xs text-white" />
                                                    <span className="text-[10px] text-slate-500">MIN</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: CLOUD */}
                    {activeTab === 'cloud' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Local Intelligence */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Cpu className="w-5 h-5 mr-2 text-emerald-400" /> Local Intelligence (Privacy Focused)
                                </h3>
                                <div className="p-5 bg-slate-950 rounded-lg border border-slate-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                                <Server className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-200">LM Studio / Local Server</h4>
                                                <p className="text-xs text-slate-500">Connect to locally running LLMs (Llama 3, Mistral, Qwen)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {lmStudioTest.status === 'testing' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
                                            {lmStudioTest.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                            {lmStudioTest.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                                            <button
                                                onClick={handleTestLmStudio}
                                                disabled={lmStudioTest.status === 'testing'}
                                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors"
                                            >
                                                Test Connection
                                            </button>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    {lmStudioTest.status === 'testing' && (
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 mb-4 overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${lmStudioTest.progress}%` }}
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Local Server URL</label>
                                            <input
                                                type="text"
                                                value={settings.ai_provider?.lm_studio_url || 'http://localhost:1234/v1/models'}
                                                onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, lm_studio_url: e.target.value } })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Selected Model</label>
                                            <select
                                                value={settings.ai_provider?.lm_studio_model || ''}
                                                onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, lm_studio_model: e.target.value } })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="">Auto-Detect (First Available)</option>
                                                {availableModels.map(m => (
                                                    <option key={m.id} value={m.id}>{m.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {lmStudioTest.message && (
                                        <div className={`mt-3 text-xs px-3 py-2 rounded border ${lmStudioTest.status === 'error' ? 'bg-red-900/10 border-red-900/20 text-red-300' : 'bg-green-900/10 border-green-900/20 text-green-300'}`}>
                                            <strong>{lmStudioTest.status === 'success' ? 'Success:' : 'Error:'}</strong> {lmStudioTest.message}
                                            {lmStudioTest.details && <div className="mt-1 opacity-75">{lmStudioTest.details}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Free Cloud APIs */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2 text-blue-400" /> Free / Open Cloud APIs
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <CloudKeyBox
                                        name="Google Gemini"
                                        icon="G"
                                        value={settings.ai_provider.google_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, google_key: v } })}
                                        onTest={() => handleTestKey('google', settings.ai_provider.google_key)}
                                        testStatus={apiTestProgress['google']?.status}
                                        testProgress={apiTestProgress['google']?.progress}
                                        testMessage={apiTestProgress['google']?.message}
                                        testDetails={apiTestProgress['google']?.details}
                                        modelValue={settings.ai_provider?.google_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, google_model: v } })}
                                        predefinedModels={['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-1.0-pro']}
                                    />
                                    <CloudKeyBox
                                        name="Groq (Llama 3)"
                                        icon="GQ"
                                        value={settings.ai_provider.groq_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, groq_key: v } })}
                                        onTest={() => handleTestKey('groq', settings.ai_provider.groq_key)}
                                        testStatus={apiTestProgress['groq']?.status}
                                        testProgress={apiTestProgress['groq']?.progress}
                                        testMessage={apiTestProgress['groq']?.message}
                                        testDetails={apiTestProgress['groq']?.details}
                                        modelValue={settings.ai_provider?.groq_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, groq_model: v } })}
                                        predefinedModels={['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma-2-9b-it']}
                                    />
                                    <CloudKeyBox
                                        name="HuggingFace"
                                        icon="HF"
                                        value={settings.ai_provider.huggingface_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, huggingface_key: v } })}
                                        onTest={() => handleTestKey('huggingface', settings.ai_provider.huggingface_key)}
                                        testStatus={apiTestProgress['huggingface']?.status}
                                        testProgress={apiTestProgress['huggingface']?.progress}
                                        testMessage={apiTestProgress['huggingface']?.message}
                                        testDetails={apiTestProgress['huggingface']?.details}
                                        modelValue={settings.ai_provider?.huggingface_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, huggingface_model: v } })}
                                        modelPlaceholder="meta-llama/Meta-Llama-3-8B-Instruct"
                                        predefinedModels={['meta-llama/Meta-Llama-3-8B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3', 'microsoft/Phi-3-mini-4k-instruct']}
                                    />
                                </div>
                            </div>

                            {/* Paid Cloud APIs */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Key className="w-5 h-5 mr-2 text-yellow-500" /> Premium / Paid APIs
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <CloudKeyBox
                                        name="OpenAI"
                                        icon="OA"
                                        value={settings.ai_provider.openai_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openai_key: v } })}
                                        onTest={() => handleTestKey('openai', settings.ai_provider.openai_key)}
                                        testStatus={apiTestProgress['openai']?.status}
                                        testProgress={apiTestProgress['openai']?.progress}
                                        testMessage={apiTestProgress['openai']?.message}
                                        testDetails={apiTestProgress['openai']?.details}
                                        modelValue={settings.ai_provider?.openai_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openai_model: v } })}
                                        predefinedModels={['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']}
                                        showBaseUrl={true}
                                        baseUrlValue={settings.ai_provider?.custom_base_url} /* Reusing custom_base_url for now or add specific if needed */
                                    />
                                    <CloudKeyBox
                                        name="Anthropic"
                                        icon="AN"
                                        value={settings.ai_provider.anthropic_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, anthropic_key: v } })}
                                        onTest={() => handleTestKey('anthropic', settings.ai_provider.anthropic_key)}
                                        testStatus={apiTestProgress['anthropic']?.status}
                                        testProgress={apiTestProgress['anthropic']?.progress}
                                        testMessage={apiTestProgress['anthropic']?.message}
                                        testDetails={apiTestProgress['anthropic']?.details}
                                        modelValue={settings.ai_provider?.anthropic_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, anthropic_model: v } })}
                                        predefinedModels={['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']}
                                    />
                                    <CloudKeyBox
                                        name="DeepSeek"
                                        icon="DS"
                                        value={settings.ai_provider.deepseek_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, deepseek_key: v } })}
                                        onTest={() => handleTestKey('deepseek', settings.ai_provider.deepseek_key)}
                                        testStatus={apiTestProgress['deepseek']?.status}
                                        testProgress={apiTestProgress['deepseek']?.progress}
                                        testMessage={apiTestProgress['deepseek']?.message}
                                        testDetails={apiTestProgress['deepseek']?.details}
                                        modelValue={settings.ai_provider?.deepseek_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, deepseek_model: v } })}
                                        predefinedModels={['deepseek-chat', 'deepseek-coder']}
                                    />
                                    <CloudKeyBox
                                        name="OpenRouter"
                                        icon="OR"
                                        value={settings.ai_provider.openrouter_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openrouter_key: v } })}
                                        onTest={() => handleTestKey('openrouter', settings.ai_provider.openrouter_key)}
                                        testStatus={apiTestProgress['openrouter']?.status}
                                        testProgress={apiTestProgress['openrouter']?.progress}
                                        testMessage={apiTestProgress['openrouter']?.message}
                                        testDetails={apiTestProgress['openrouter']?.details}
                                        modelValue={settings.ai_provider?.openrouter_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openrouter_model: v } })}
                                        predefinedModels={['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5', 'meta-llama/llama-3-70b-instruct']}
                                    />
                                    <CloudKeyBox
                                        name="GLM 4"
                                        icon="ZM"
                                        value={settings.ai_provider.glm_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, glm_key: v } })}
                                        onTest={() => handleTestKey('glm', settings.ai_provider.glm_key)}
                                        testStatus={apiTestProgress['glm']?.status}
                                        testProgress={apiTestProgress['glm']?.progress}
                                        testMessage={apiTestProgress['glm']?.message}
                                        testDetails={apiTestProgress['glm']?.details}
                                        modelValue={settings.ai_provider?.glm_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, glm_model: v } })}
                                        predefinedModels={['glm-4', 'glm-3-turbo']}
                                    />
                                    <CloudKeyBox
                                        name="Moonshot (Kimi)"
                                        icon="MS"
                                        value={settings.ai_provider.kimi_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, kimi_key: v } })}
                                        onTest={() => handleTestKey('kimi', settings.ai_provider.kimi_key)}
                                        testStatus={apiTestProgress['kimi']?.status}
                                        testProgress={apiTestProgress['kimi']?.progress}
                                        testMessage={apiTestProgress['kimi']?.message}
                                        testDetails={apiTestProgress['kimi']?.details}
                                        modelValue={settings.ai_provider?.kimi_model}
                                        onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, kimi_model: v } })}
                                        predefinedModels={['moonshot-v1-8k', 'moonshot-v1-32k']}
                                    />
                                </div>
                            </div>

                            {/* Search APIs */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Search className="w-5 h-5 mr-2 text-purple-400" /> Search Engines
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <CloudKeyBox
                                        name="Brave Search"
                                        icon="BR"
                                        value={settings.ai_provider.brave_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, brave_key: v } })}
                                        onTest={() => handleTestKey('brave', settings.ai_provider.brave_key, 'brave')}
                                        testStatus={apiTestProgress['brave']?.status}
                                        testProgress={apiTestProgress['brave']?.progress}
                                        testMessage={apiTestProgress['brave']?.message}
                                        testDetails={apiTestProgress['brave']?.details}
                                        modelPlaceholder="N/A"
                                    />
                                    <CloudKeyBox
                                        name="Serper Dev"
                                        icon="SD"
                                        value={settings.ai_provider.serper_key}
                                        onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, serper_key: v } })}
                                        onTest={() => handleTestKey('serper', settings.ai_provider.serper_key, 'brave')} // Using brave type regarding implementation
                                        testStatus={apiTestProgress['serper']?.status}
                                        testProgress={apiTestProgress['serper']?.progress}
                                        testMessage={apiTestProgress['serper']?.message}
                                        testDetails={apiTestProgress['serper']?.details}
                                        modelPlaceholder="N/A"
                                    />
                                </div>
                            </div>

                            {/* Bohrium */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Bot className="w-5 h-5 mr-2 text-pink-400" /> Bohrium Swarm Intelligence
                                </h3>
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-bold text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">BH</span>
                                            <span className="text-sm font-medium text-slate-300">Bohrium Gateway</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={settings.ai_provider?.bohrium_url || ''}
                                            onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, bohrium_url: e.target.value } })}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white placeholder-slate-600"
                                            placeholder="http://localhost:8000"
                                        />
                                        <button
                                            onClick={() => handleTestKey('bohrium', settings.ai_provider.bohrium_url, 'bohrium')}
                                            disabled={apiTestProgress['bohrium']?.status === 'testing'}
                                            className="px-3 bg-slate-800 text-xs text-white rounded hover:bg-slate-700 disabled:opacity-50"
                                        >
                                            Test
                                        </button>
                                    </div>

                                    {/* Progress Bar & Status Message */}
                                    {(apiTestProgress['bohrium']?.status !== 'idle' || apiTestProgress['bohrium']?.message) && (
                                        <div className="mt-3 mb-2 animate-in fade-in slide-in-from-top-1">
                                            {apiTestProgress['bohrium']?.status === 'testing' && (
                                                <div className="w-full bg-slate-900 rounded-full h-1 mb-2 overflow-hidden">
                                                    <div
                                                        className="bg-pink-500 h-1 rounded-full transition-all duration-300"
                                                        style={{ width: `${apiTestProgress['bohrium']?.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1">
                                                    <p className={`text-xs font-bold ${apiTestProgress['bohrium']?.status === 'error' ? 'text-red-400' : apiTestProgress['bohrium']?.status === 'success' ? 'text-emerald-400' : 'text-pink-400'}`}>
                                                        {apiTestProgress['bohrium']?.message}
                                                    </p>
                                                    {apiTestProgress['bohrium']?.details && (
                                                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono break-all">{apiTestProgress['bohrium']?.details}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: CHANNELS */}
                    {activeTab === 'channels' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <ChannelsSettingsPanel />
                        </div>
                    )}

                    {/* TAB: PHARMA */}
                    {activeTab === 'pharma' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Shield className="w-5 h-5 mr-2 text-emerald-400" /> Compliance & Safety
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">Citation Lock</h4>
                                            <p className="text-xs text-slate-400">Lock outputs without sufficient sources.</p>
                                        </div>
                                        <select value={settings.pharma.citation_threshold} onChange={(e) => setSettings({ ...settings, pharma: { ...settings.pharma, citation_threshold: e.target.value as any } })} className="bg-slate-900 border border-slate-700 text-white text-sm rounded border-none px-2 py-1">
                                            <option value="low">Low</option>
                                            <option value="medium">Standard</option>
                                            <option value="high">Strict</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                                    <Database className="w-5 h-5 mr-2 text-cyan-400" /> Literature Sources
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ToggleCard icon={Activity} label="PubMed" enabled={settings.pharma.sources.pubmed} onClick={() => updatePharmaSource('pubmed', !settings.pharma.sources.pubmed)} color="blue" />
                                    <ToggleCard icon={Activity} label="PubMed Central" enabled={settings.pharma.sources.pmc} onClick={() => updatePharmaSource('pmc', !settings.pharma.sources.pmc)} color="emerald" />
                                    <ToggleCard icon={Globe} label="Google Scholar" enabled={settings.pharma.sources.google_scholar} onClick={() => updatePharmaSource('google_scholar', !settings.pharma.sources.google_scholar)} color="sky" />
                                    <ToggleCard icon={BookOpen} label="OpenAlex" enabled={settings.pharma.sources.openalex} onClick={() => updatePharmaSource('openalex', !settings.pharma.sources.openalex)} color="indigo" />
                                    <ToggleCard icon={FlaskConical} label="BioRxiv (Preprints)" enabled={settings.pharma.sources.biorxiv} onClick={() => updatePharmaSource('biorxiv', !settings.pharma.sources.biorxiv)} color="red" />
                                    <ToggleCard icon={FlaskConical} label="ChemRxiv" enabled={settings.pharma.sources.chemrxiv} onClick={() => updatePharmaSource('chemrxiv', !settings.pharma.sources.chemrxiv)} color="cyan" />
                                    <ToggleCard icon={Activity} label="ClinicalTrials.gov" enabled={settings.pharma.sources.clinicaltrials} onClick={() => updatePharmaSource('clinicaltrials', !settings.pharma.sources.clinicaltrials)} color="teal" />
                                    <ToggleCard icon={BookOpen} label="Semantic Scholar" enabled={settings.pharma.sources.semantic_scholar} onClick={() => updatePharmaSource('semantic_scholar', !settings.pharma.sources.semantic_scholar)} color="blue" />
                                    <ToggleCard icon={Globe} label="IEEE Xplore" enabled={settings.pharma.sources.ieee} onClick={() => updatePharmaSource('ieee', !settings.pharma.sources.ieee)} color="slate" />
                                    <ToggleCard icon={Database} label="Elsevier (ScienceDirect)" enabled={settings.pharma.sources.elsevier} onClick={() => updatePharmaSource('elsevier', !settings.pharma.sources.elsevier)} color="orange" />
                                    <ToggleCard icon={Database} label="Scopus" enabled={settings.pharma.sources.scopus} onClick={() => updatePharmaSource('scopus', !settings.pharma.sources.scopus)} color="orange" />
                                    <ToggleCard icon={Globe} label="Web of Science" enabled={settings.pharma.sources.wos} onClick={() => updatePharmaSource('wos', !settings.pharma.sources.wos)} color="purple" />
                                    <ToggleCard icon={Search} label="Science Index" enabled={settings.pharma.sources.science_index} onClick={() => updatePharmaSource('science_index', !settings.pharma.sources.science_index)} color="pink" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SEARCH & KNOWLEDGE */}
                    {activeTab === 'search' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Globe className="w-5 h-5 mr-2 text-indigo-400" /> SurfSense Knowledge Engine
                                </h3>
                                <div className="p-5 bg-slate-950 rounded-lg border border-slate-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                                <Search className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-200">SurfSense Deep Research</h4>
                                                <p className="text-xs text-slate-500">Autonomous web research and knowledge aggregation system.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Auto-Start</span>
                                            <button
                                                onClick={() => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, surfsense_auto_start: !settings.ai_provider.surfsense_auto_start } })}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.ai_provider.surfsense_auto_start ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.ai_provider.surfsense_auto_start ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">SurfSense API URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={settings.ai_provider.surfsense_url || 'http://localhost:3003'}
                                                    onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, surfsense_url: e.target.value } })}
                                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                    placeholder="http://localhost:3003"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Admin Key (Optional)</label>
                                            <input
                                                type="password"
                                                value={settings.ai_provider.surfsense_key || ''}
                                                onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, surfsense_key: e.target.value } })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                placeholder="Enter SurfSense API Key if configured..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reporting Configuration (Moved from Output) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-orange-400" /> Reporting & Input Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Input / Citation Style</label>
                                            <select
                                                value={settings.output?.citation_style || 'apa'}
                                                onChange={(e) => setSettings({ ...settings, output: { ...settings.output, citation_style: e.target.value as any } })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="apa">APA (American Psychological Assoc.)</option>
                                                <option value="nature">Nature / Science (Numbered)</option>
                                                <option value="ieee">IEEE (Technical)</option>
                                                <option value="chicago">Chicago (Humanities)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Output Format</label>
                                            <div className="flex gap-2 h-[38px] items-center">
                                                {['markdown', 'pdf', 'docx'].map(fmt => (
                                                    <button key={fmt} onClick={() => setSettings({ ...settings, output: { ...settings.output, format: fmt as any } })} className={`flex-1 h-full rounded text-xs font-bold uppercase border transition-all ${settings.output.format === fmt ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{fmt}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Internals (Moved from Output) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Wrench className="w-5 h-5 mr-2 text-blue-400" /> System Internals
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">Log Level</h4>
                                            <p className="text-xs text-slate-400">Verbosity of backend research logs.</p>
                                        </div>
                                        <select
                                            value={settings.system?.log_level || 'INFO'}
                                            onChange={(e) => setSettings({ ...settings, system: { ...settings.system, log_level: e.target.value as any } })}
                                            className="bg-slate-900 border border-slate-700 text-white text-sm rounded px-2 py-1"
                                        >
                                            <option value="DEBUG">DEBUG</option>
                                            <option value="INFO">INFO</option>
                                            <option value="WARNING">WARNING</option>
                                            <option value="ERROR">ERROR</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">Auto-Update System</h4>
                                            <p className="text-xs text-slate-400">Pull latest BioDockify AI Docker images automatically.</p>
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, system: { ...settings.system, auto_update: !settings.system?.auto_update } })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.system?.auto_update ? 'bg-teal-600' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.system?.auto_update ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}




                    {/* TAB: BACKUP */}
                    {activeTab === 'backup' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <CloudBackupControl />
                        </div>
                    )}

                    {/* TAB: PERSONA */}
                    {activeTab === 'persona' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in duration-300">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <BookOpen className="w-5 h-5 mr-2 text-yellow-400" /> Research Persona & Bot Identity
                            </h3>

                            {/* Researcher Persona */}
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-800 pb-2">Researcher Profile</h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase block mb-1">Full Name</label>
                                            <input type="text" value={settings.persona?.name || ''} onChange={e => setSettings({ ...settings, persona: { ...settings.persona, name: e.target.value } })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none" placeholder="Dr. Jane Doe" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase block mb-1">Email Address</label>
                                            <input type="email" value={settings.persona?.email || ''} onChange={e => setSettings({ ...settings, persona: { ...settings.persona, email: e.target.value } })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none" placeholder="jane.doe@university.edu" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase block mb-1">Organization / University</label>
                                            <input type="text" value={settings.persona?.organization || ''} onChange={e => setSettings({ ...settings, persona: { ...settings.persona, organization: e.target.value } })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none" placeholder="BioDockify Research Institute" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase block mb-1">Department</label>
                                            <input type="text" value={settings.persona?.department || ''} onChange={e => setSettings({ ...settings, persona: { ...settings.persona, department: e.target.value } })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none" placeholder="Molecular Biology" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase block mb-1">Introduce Yourself to BioDockify AI</label>
                                        <textarea
                                            value={settings.persona?.introduction || ''}
                                            onChange={e => setSettings({ ...settings, persona: { ...settings.persona, introduction: e.target.value } })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white h-24 focus:border-yellow-500/50 focus:outline-none"
                                            placeholder="I am a senior researcher focusing on protein folding simulations. I prefer concise technical summaries and Python-based data analysis."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* BioDockify AI Bot Persona */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
                                    <span>BioDockify AI Bot Identity</span>
                                    <Bot className="w-4 h-4 text-slate-500" />
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase block mb-1">Bot Name</label>
                                        <input type="text" value={settings.persona?.bot_name || ''} onChange={e => setSettings({ ...settings, persona: { ...settings.persona, bot_name: e.target.value } })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none" placeholder="e.g. Helix, Jarvis, Research Assistant" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase block mb-1">Role Allotment & Instructions</label>
                                        <textarea
                                            value={settings.persona?.bot_instructions || ''}
                                            onChange={e => setSettings({ ...settings, persona: { ...settings.persona, bot_instructions: e.target.value } })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white h-24 focus:border-yellow-500/50 focus:outline-none"
                                            placeholder="You are an expert pharmaceutical research assistant. Prioritize safety and accuracy. Always cite sources from PubMed when available."
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Define how the AI should behave, its tone, and specific responsibilities.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-6 hidden lg:block">
                    <div className="bg-teal-950/30 border border-teal-900/50 rounded-xl p-6">
                        <h4 className="text-sm font-bold text-teal-400 mb-3 uppercase tracking-wider">Active Status</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between"><span className="text-slate-400">Mode</span><span className="text-white font-mono">{settings.ai_provider?.mode?.toUpperCase()}</span></li>
                            <li className="flex justify-between"><span className="text-slate-400">Format</span><span className="text-white font-mono">{settings.output?.format?.toUpperCase()}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---
const CloudKeyBox = ({ name, value, icon, onChange, onTest, testStatus = 'idle', testProgress = 0, testMessage = '', testDetails = '', modelValue, onModelChange, modelPlaceholder, baseUrlValue, onBaseUrlChange, showBaseUrl = false, predefinedModels = [] }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusIcon = () => {
        if (testStatus === 'testing') return <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />;
        if (testStatus === 'success') return <CheckCircle className="w-3 h-3 text-green-400" />;
        if (testStatus === 'error') return <AlertCircle className="w-3 h-3 text-red-400" />;
        return null;
    };

    return (
        <div className={`p-4 bg-slate-950 rounded-lg border transition-all ${testStatus === 'success' ? 'border-green-500/30' : testStatus === 'error' ? 'border-red-500/30' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">{icon}</span>
                    <span className="text-sm font-medium text-slate-300">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    {showBaseUrl && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-slate-500 hover:text-slate-300">
                            {isExpanded ? 'Simple' : 'Advanced'}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex space-x-2 mb-2">
                <input
                    type="password"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white placeholder-slate-600"
                    placeholder="API Key..."
                />
                <button
                    onClick={onTest}
                    disabled={testStatus === 'testing' || !value}
                    className="px-3 bg-slate-800 text-xs text-white rounded hover:bg-slate-700 disabled:opacity-50"
                >
                    Test
                </button>
            </div>

            {/* Model Selection - ALWAYS VISIBLE */}
            <div className="mt-4">
                {predefinedModels.length > 0 ? (
                    <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Model ID</label>
                        <div className="flex gap-2">
                            <select
                                value={modelValue || ''}
                                onChange={(e) => onModelChange(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            >
                                <option value="">Select a Model...</option>
                                {predefinedModels.map((m: string) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            {/* Allow custom input even with predefined models */}
                            <input
                                type="text"
                                value={modelValue || ''}
                                onChange={(e) => onModelChange(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600"
                                placeholder="Or type custom..."
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Model ID</label>
                        <input
                            type="text"
                            value={modelValue || ''}
                            onChange={(e) => onModelChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600"
                            placeholder={modelPlaceholder || "e.g. gpt-4o"}
                        />
                    </div>
                )}
            </div>

            {/* Progress Bar & Status Message */}
            {(testStatus !== 'idle' || testMessage) && (
                <div className="mt-3 mb-2 animate-in fade-in slide-in-from-top-1">
                    {testStatus === 'testing' && (
                        <div className="w-full bg-slate-900 rounded-full h-1 mb-2 overflow-hidden">
                            <div
                                className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${testProgress}%` }}
                            />
                        </div>
                    )}
                    <div className="flex items-start gap-2">
                        <div className="flex-1">
                            <p className={`text-xs font-bold ${testStatus === 'error' ? 'text-red-400' : testStatus === 'success' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                {testMessage}
                            </p>
                            {testDetails && (
                                <p className="text-[10px] text-slate-500 mt-0.5 font-mono break-all">{testDetails}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Options (Base URL) */}
            {isExpanded && showBaseUrl && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-800/50 animate-in fade-in slide-in-from-top-1">
                    <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Base URL (Legacy/Proxy)</label>
                        <input
                            type="text"
                            value={baseUrlValue || ''}
                            onChange={(e) => onBaseUrlChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600"
                            placeholder="https://api.openai.com/v1"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const ToggleCard = ({ icon: Icon, label, enabled, onClick, color = 'teal' }: any) => (
    <button onClick={onClick} className={`flex items-center p-3 rounded-lg border transition-all ${enabled ? `bg-${color}-500/10 border-${color}-500/50 text-white` : 'bg-slate-950 border-slate-800 text-slate-500'} w-full`}>
        <div className={`p-2 rounded-md mr-3 ${enabled ? `bg-${color}-500 text-black` : 'bg-slate-900'}`}><Icon className="w-4 h-4" /></div>
        <span className="font-semibold text-sm">{label}</span>
    </button>
);

const CloudBackupControl = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-6">
            <Cloud className="mx-auto w-12 h-12 text-slate-600" />
            <h3 className="text-xl font-bold text-white">Cloud Backup</h3>
            <p className="text-sm text-slate-500">Secure your research data in Google Drive.</p>
            <button className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold">Connect Drive</button>
        </div>
    );
};
