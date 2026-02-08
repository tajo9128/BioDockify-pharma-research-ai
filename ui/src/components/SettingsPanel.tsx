import React, { useState, useEffect } from 'react';
import { api, Settings } from '@/lib/api';
import { AGENT_PERSONAS } from '@/lib/personas';
import ChannelsSettingsPanel from './ChannelsSettingsPanel';
import { Save, Server, Cloud, Cpu, RefreshCw, CheckCircle, AlertCircle, Shield, Activity, Power, BookOpen, Layers, FileText, Globe, Database, Key, FlaskConical, Link, FolderOpen, UserCircle, Lock, Unlock, Sparkles, Wrench, MessageCircle, Search, Bot } from 'lucide-react';


// Extended Settings interface matching "Fully Loaded" specs + New User Requests
interface AdvancedSettings extends Omit<Settings, 'persona'> {
    system: {
        max_cpu_percent: number;
        internet_research: boolean;
        auto_update?: boolean;
        log_level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
    };
    nanobot?: {
        headless_browser: boolean;
        stealth_mode: boolean;
        browser_timeout: number;
    };
    ai_advanced: {
        context_window: number;
        gpu_layers: number;
        thread_count: number;
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
    persona: Settings['persona'] & {
        department: string;
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
            huggingface_key: '',
            openrouter_key: '',
            groq_key: '',
            groq_model: 'llama-3.3-70b-versatile',
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
        jina: 'idle'
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

                const autoConfigured = localStorage.getItem('biodockify_lm_studio_auto_configured');
                if (autoConfigured === 'true') setIsAutoConfigured(true);
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
            alert('Settings saved locally! (Backend sync failed)');
        } else {
            alert('Settings saved successfully!');
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

        try {
            const { universalFetch } = await import('@/lib/services/universal-fetch');
            const modelsRes = await universalFetch(modelsUrl, { method: 'GET', timeout: 8000 });

            if (!modelsRes.ok) throw new Error(`Server returned ${modelsRes.status}`);

            const modelsData = await modelsRes.json();
            const models = modelsData?.data || [];
            if (models.length === 0) {
                setLmStudioTest({ status: 'error', progress: 100, message: 'FAILED: No model loaded', details: 'Server running but no model is loaded.' });
                return;
            }

            setAvailableModels(models);
            const modelId = models[0]?.id || 'unknown';

            setLmStudioTest(prev => ({ ...prev, progress: 75, message: `Testing response...` }));

            const testRes = await universalFetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 }),
                timeout: 8000
            });

            if (!testRes.ok) throw new Error(`Model test failed: HTTP ${testRes.status}`);

            setLmStudioTest({ status: 'success', progress: 100, message: 'PASSED: LM Studio Connected', details: 'Local LLM is ready.' });
        } catch (e: any) {
            setLmStudioTest({ status: 'error', progress: 100, message: 'FAILED: Connection Error', details: e.message });
        }
    };

    const handleTestKey = async (provider: string, key?: string, serviceType: 'llm' | 'elsevier' | 'bohrium' | 'brave' = 'llm', baseUrl?: string, model?: string) => {
        if (!key) return;
        setApiTestProgress(prev => ({ ...prev, [provider]: { status: 'testing', progress: 20, message: 'Testing...', details: '' } }));
        setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));

        try {
            const result = await api.testConnection(serviceType, provider, key, provider === 'custom' ? baseUrl : undefined, model);
            if (result.status === 'success') {
                setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
                setApiTestProgress(prev => ({ ...prev, [provider]: { status: 'success', progress: 100, message: 'PASSED', details: result.message } }));
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
            setApiTestProgress(prev => ({ ...prev, [provider]: { status: 'error', progress: 100, message: 'FAILED', details: err.message } }));
        }
    };

    const handleSettingChange = (section: keyof AdvancedSettings, value: any) => {
        setSettings(prev => ({ ...prev, [section]: value }));
    };

    const updatePharmaSource = (key: keyof typeof settings.pharma.sources, val: boolean) => {
        setSettings({ ...settings, pharma: { ...settings.pharma, sources: { ...settings.pharma.sources, [key]: val } } });
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
                <TabButton id="channels" label="Channels" icon={Globe} />
                <TabButton id="pharma" label="Pharma & Sources" icon={Database} />
                <TabButton id="search" label="Search & Knowledge" icon={Search} />
                <TabButton id="output" label="Output & System" icon={FileText} />
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
                                    <UserCircle className="w-5 h-5 text-indigo-400" /> Agent Zero Persona
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
                                    <Bot className="w-5 h-5 mr-2 text-teal-400" /> Research Orchestration
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                        <div className="flex-1 pr-4">
                                            <h4 className="text-sm font-bold text-white mb-1">Human Approval Gates</h4>
                                            <p className="text-xs text-slate-500">Agent Zero must ask for permission before critical actions.</p>
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
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Globe className="w-3 h-3" /> NanoBot Browser</h4>
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
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2 text-yellow-400" /> AI Providers
                                </h3>
                                <div className="grid gap-4">
                                    <CloudKeyBox name="OpenRouter" icon="OR" modelValue={settings.ai_provider?.openrouter_model} onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openrouter_model: v } })} value={settings.ai_provider.openrouter_key} onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, openrouter_key: v } })} onTest={() => handleTestKey('openrouter', settings.ai_provider.openrouter_key)} testStatus={testStatus.openrouter} testProgress={apiTestProgress.openrouter} />
                                    <CloudKeyBox name="Google Gemini" icon="G" modelValue={settings.ai_provider?.google_model} onModelChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, google_model: v } })} value={settings.ai_provider.google_key} onChange={(v: string) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, google_key: v } })} onTest={() => handleTestKey('google', settings.ai_provider.google_key)} testStatus={testStatus.google} testProgress={apiTestProgress.google} />
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
                                    <ToggleCard icon={Activity} label="PubMed Central" enabled={settings.pharma.sources.pmc} onClick={() => updatePharmaSource('pmc', !settings.pharma.sources.pmc)} color="emerald" />
                                    <ToggleCard icon={Globe} label="Google Scholar" enabled={settings.pharma.sources.google_scholar} onClick={() => updatePharmaSource('google_scholar', !settings.pharma.sources.google_scholar)} color="sky" />
                                    <ToggleCard icon={BookOpen} label="OpenAlex" enabled={settings.pharma.sources.openalex} onClick={() => updatePharmaSource('openalex', !settings.pharma.sources.openalex)} color="indigo" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: OUTPUT & SYSTEM */}
                    {activeTab === 'output' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-orange-400" /> Reporting Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Preferred Format</label>
                                        <div className="flex gap-2">
                                            {['markdown', 'pdf', 'docx'].map(fmt => (
                                                <button key={fmt} onClick={() => setSettings({ ...settings, output: { ...settings.output, format: fmt as any } })} className={`px-3 py-1.5 rounded text-xs font-bold uppercase border ${settings.output.format === fmt ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{fmt}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Internals */}
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
                                            <h4 className="text-sm font-semibold text-white">Auto-Update Agent</h4>
                                            <p className="text-xs text-slate-400">Pull latest Docker images automatically.</p>
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
                                <BookOpen className="w-5 h-5 mr-2 text-yellow-400" /> Research Persona Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase block mb-1">Full Name</label>
                                    <input type="text" value={settings.persona?.name || ''} onChange={e => setSettings({ ...settings, persona: { ...settings.persona, name: e.target.value } })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white" />
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
const CloudKeyBox = ({ name, value, icon, onChange, onTest, testStatus = 'idle', testProgress, modelValue, onModelChange, modelPlaceholder }: any) => {
    const getStatusIcon = () => {
        if (testStatus === 'testing') return <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />;
        if (testStatus === 'success') return <CheckCircle className="w-3 h-3 text-green-400" />;
        if (testStatus === 'error') return <AlertCircle className="w-3 h-3 text-red-400" />;
        return null;
    };

    return (
        <div className={`p-4 bg-slate-950 rounded-lg border ${testStatus === 'success' ? 'border-green-500/30' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">{icon}</span>
                    <span className="text-sm font-medium text-slate-300">{name}</span>
                </div>
                {getStatusIcon()}
            </div>
            <div className="flex space-x-2">
                <input type="password" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" placeholder="Key..." />
                <button onClick={onTest} disabled={testStatus === 'testing'} className="px-3 bg-slate-800 text-xs text-white rounded hover:bg-slate-700">Test</button>
            </div>
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
