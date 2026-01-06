import React, { useState, useEffect } from 'react';
import { api, Settings } from '@/lib/api';
import { Save, Server, Cloud, Cpu, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPanel() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [connectionMsg, setConnectionMsg] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // Mock default settings if API fails or returns empty
            const defaultSettings: Settings = {
                project: { name: 'New Project', type: 'Drug Discovery', disease_context: 'Alzheimer\'s', stage: 'Early Discovery' },
                agent: { mode: 'assisted', reasoning_depth: 'standard', self_correction: true, max_retries: 3, failure_policy: 'ask_user' },
                literature: { sources: ['pubmed'], enable_crossref: true, enable_preprints: false, year_range: 5, novelty_strictness: 'medium' },
                ai_provider: { mode: 'auto', ollama_url: 'http://localhost:11434', ollama_model: 'llama2' }
            };

            try {
                const remoteSettings = await api.getSettings();
                if (remoteSettings && remoteSettings.ai_provider) {
                    setSettings(remoteSettings);
                } else {
                    setSettings(defaultSettings);
                }
            } catch (e) {
                console.warn('Failed to load settings, using defaults', e);
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await api.saveSettings(settings);
            // Show success feedback (toast or log)
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const checkOllamaConnection = async () => {
        if (!settings?.ai_provider?.ollama_url) return;

        setConnectionMsg('Checking connection...');
        setOllamaStatus('unknown');

        try {
            const res = await api.checkOllama(settings.ai_provider.ollama_url);
            if (res.status === 'ok') {
                setOllamaStatus('success');
                setOllamaModels(res.models || []);
                setConnectionMsg('Connected successfully');
            } else {
                setOllamaStatus('error');
                setConnectionMsg(res.message || 'Connection failed');
            }
        } catch (e: any) {
            setOllamaStatus('error');
            setConnectionMsg(e.message || 'Connection failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
    if (!settings) return <div className="p-8 text-center text-red-400">Error loading settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    System Configuration
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* AI Provider Section */}
                <div className="bg-slate-900/80 backdrop-blur rounded-xl p-6 border border-slate-700 md:col-span-2">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Cpu className="w-5 h-5 mr-2 text-teal-400" />
                        AI Hardware & Provider
                    </h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Provider Mode</label>
                                <select
                                    value={settings.ai_provider.mode}
                                    onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, mode: e.target.value as any } })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                >
                                    <option value="auto">Auto (Smart Fallback)</option>
                                    <option value="ollama">Local (Ollama)</option>
                                    <option value="z-ai">Cloud (z-ai)</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    'Auto' attempts to use local Ollama first, then falls back to Cloud if unavailable.
                                </p>
                            </div>

                            {/* Ollama specific settings */}
                            {(settings.ai_provider.mode === 'ollama' || settings.ai_provider.mode === 'auto') && (
                                <div className="md:col-span-2 space-y-4 border-l border-slate-800 pl-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                            <Server className="w-4 h-4 mr-2" /> Local Inference (Ollama)
                                        </span>
                                        {ollamaStatus === 'success' && <span className="text-xs text-green-400 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Connected</span>}
                                        {ollamaStatus === 'error' && <span className="text-xs text-red-400 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Disconnected</span>}
                                    </div>

                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={settings.ai_provider.ollama_url || ''}
                                            onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, ollama_url: e.target.value } })}
                                            placeholder="http://localhost:11434"
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                                        />
                                        <button
                                            onClick={checkOllamaConnection}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm border border-slate-600"
                                        >
                                            Check
                                        </button>
                                    </div>
                                    {connectionMsg && <p className="text-xs text-slate-500">{connectionMsg}</p>}

                                    {ollamaModels.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Select Model</label>
                                            <select
                                                value={settings.ai_provider.ollama_model}
                                                onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, ollama_model: e.target.value } })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                            >
                                                {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* z-ai specific settings */}
                            {settings.ai_provider.mode === 'z-ai' && (
                                <div className="md:col-span-2 space-y-4 border-l border-slate-800 pl-6">
                                    <h4 className="text-sm font-medium text-slate-300 flex items-center">
                                        <Cloud className="w-4 h-4 mr-2" /> Cloud Inference (z-ai)
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">API Key (Optional)</label>
                                        <input
                                            type="password"
                                            value={settings.ai_provider.zai_key || ''}
                                            onChange={(e) => setSettings({ ...settings, ai_provider: { ...settings.ai_provider, zai_key: e.target.value } })}
                                            placeholder="Enter custom API key to override defaults"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Project Context */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Project Context</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Disease Context</label>
                            <input
                                type="text"
                                value={settings.project.disease_context}
                                onChange={(e) => setSettings({ ...settings, project: { ...settings.project, disease_context: e.target.value } })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Research Stage</label>
                            <select
                                value={settings.project.stage}
                                onChange={(e) => setSettings({ ...settings, project: { ...settings.project, stage: e.target.value } })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                            >
                                <option>Target Identification</option>
                                <option>Hit Generation</option>
                                <option>Lead Optimization</option>
                                <option>Preclinical</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Agent Behavior */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Agent Behavior</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Reasoning Depth</label>
                            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-700">
                                {['shallow', 'standard', 'deep'].map(depth => (
                                    <button
                                        key={depth}
                                        onClick={() => setSettings({ ...settings, agent: { ...settings.agent, reasoning_depth: depth as any } })}
                                        className={`flex-1 py-1 text-xs rounded uppercase font-medium transition-colors ${settings.agent.reasoning_depth === depth ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {depth}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Self-Correction</span>
                            <button
                                onClick={() => setSettings({ ...settings, agent: { ...settings.agent, self_correction: !settings.agent.self_correction } })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.agent.self_correction ? 'bg-teal-500' : 'bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.agent.self_correction ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
