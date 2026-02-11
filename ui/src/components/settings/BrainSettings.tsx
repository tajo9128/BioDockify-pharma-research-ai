import React, { useState } from 'react';
import { Settings, api } from '@/lib/api';
import { CloudKeyBox } from './CloudKeyBox';
import { Cpu, Server, Sparkles, Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface BrainSettingsProps {
    settings: Settings;
    onSettingChange: (section: keyof Settings, value: any) => void;
}

export const BrainSettings: React.FC<BrainSettingsProps> = ({ settings, onSettingChange }) => {
    const [availableModels, setAvailableModels] = useState<{ id: string }[]>([]);

    // LM Studio Test State
    const [lmStudioTest, setLmStudioTest] = useState<{
        status: 'idle' | 'testing' | 'success' | 'error';
        progress: number;
        message: string;
        details: string;
    }>({ status: 'idle', progress: 0, message: '', details: '' });

    // API Test Progress State
    const [apiTestProgress, setApiTestProgress] = useState<Record<string, {
        status: 'idle' | 'testing' | 'success' | 'error';
        progress: number;
        message: string;
        details: string;
    }>>({});

    const updateProvider = (key: string, value: string | boolean | number) => {
        onSettingChange('ai_provider', { ...settings.ai_provider, [key]: value });
    };

    const updateAdvanced = (key: string, value: string | boolean | number) => {
        onSettingChange('ai_advanced', { ...settings.ai_advanced, [key]: value });
    };

    const handleTestLmStudio = async () => {
        const rawUrl = (settings.ai_provider.lm_studio_url || 'http://localhost:1234/v1/models').replace(/\/$/, '');
        const baseUrl = rawUrl.replace(/\/models\/?$/, '');
        const modelsUrl = `${baseUrl}/models`;

        setLmStudioTest({ status: 'testing', progress: 10, message: 'Connecting...', details: `Testing ${modelsUrl}` });
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            const { universalFetch } = await import('@/lib/services/universal-fetch');
            let modelsRes;
            try {
                modelsRes = await universalFetch(modelsUrl, { method: 'GET', timeout: 3000 });
            } catch (_e) {
                // Connection failed - Try Auto-Start
                setLmStudioTest(prev => ({ ...prev, progress: 30, message: 'Attempting Auto-Start...', details: 'Launching application...' }));
                try {
                    const startRes = await api.diagnoseLmStudio();
                    if (startRes.success) {
                        setLmStudioTest(prev => ({ ...prev, progress: 50, message: 'Launching...', details: 'Waiting for initialization (15s)...' }));
                        await wait(15000);
                        setLmStudioTest(prev => ({ ...prev, progress: 70, message: 'Retrying connection...', details: 'Verifying startup...' }));
                        modelsRes = await universalFetch(modelsUrl, { method: 'GET', timeout: 5000 });
                    } else {
                        throw new Error(startRes.message || 'Auto-start failed');
                    }
                } catch (startErr: any) {
                    throw new Error(`Auto-start failed: ${startErr.message}`);
                }
            }

            if (!modelsRes || !modelsRes.ok) throw new Error(`Server returned ${modelsRes?.status || 'Error'}`);

            const modelsData = await modelsRes.json();
            const models = modelsData?.data || [];
            if (models.length === 0) {
                setLmStudioTest({ status: 'error', progress: 100, message: 'No model loaded', details: 'Server running but no model is loaded.' });
                return;
            }

            setAvailableModels(models);
            const modelId = models[0]?.id || 'unknown';
            setLmStudioTest(prev => ({ ...prev, progress: 85, message: `Verifying response...` }));

            const testRes = await universalFetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 }),
                timeout: 10000
            });

            if (!testRes.ok) throw new Error(`Model test failed: HTTP ${testRes.status}`);
            setLmStudioTest({ status: 'success', progress: 100, message: 'Connected', details: `Ready with ${modelId}` });
        } catch (e: any) {
            setLmStudioTest({ status: 'error', progress: 100, message: 'Connection Error', details: e.message });
        }
    };

    const handleTestKey = async (provider: string, key?: string, serviceType: 'llm' | 'elsevier' | 'bohrium' | 'brave' = 'llm', baseUrl?: string, model?: string) => {
        if (!key && provider !== 'bohrium') return; // Bohrium might use URL only

        const updateProgress = (updates: any) => {
            setApiTestProgress(prev => ({ ...prev, [provider]: { ...prev[provider], ...updates } }));
        };

        updateProgress({ status: 'testing', progress: 20, message: 'Testing...', details: '' });

        try {
            const result = await api.testConnection(serviceType, provider, key || '', provider === 'custom' ? baseUrl : undefined, model);
            if (result.status === 'success') {
                updateProgress({ status: 'success', progress: 100, message: 'PASSED', details: result.message });
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            updateProgress({ status: 'error', progress: 100, message: 'FAILED', details: err.message });
        }
    };

    return (
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
                                <p className="text-xs text-slate-500">Connect to locally running LLMs</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {lmStudioTest.status === 'testing' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
                            {lmStudioTest.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                            {lmStudioTest.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            <button onClick={handleTestLmStudio} disabled={lmStudioTest.status === 'testing'} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors">
                                Test Connection
                            </button>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    {lmStudioTest.status === 'testing' && (
                        <div className="w-full bg-slate-900 rounded-full h-1.5 mb-4 overflow-hidden">
                            <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${lmStudioTest.progress}%` }} />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Local Server URL</label>
                            <input
                                type="text"
                                value={settings.ai_provider?.lm_studio_url || 'http://localhost:1234/v1/models'}
                                onChange={(e) => updateProvider('lm_studio_url', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Selected Model</label>
                            <select
                                value={settings.ai_provider?.lm_studio_model || ''}
                                onChange={(e) => updateProvider('lm_studio_model', e.target.value)}
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
                    <CloudKeyBox name="Google Gemini" icon="G" value={settings.ai_provider.google_key || ''} onChange={(v) => updateProvider('google_key', v)} onTest={() => handleTestKey('google', settings.ai_provider.google_key)} testStatus={apiTestProgress['google']?.status} testProgress={apiTestProgress['google']?.progress} testMessage={apiTestProgress['google']?.message} testDetails={apiTestProgress['google']?.details} modelValue={settings.ai_provider?.google_model} onModelChange={(v) => updateProvider('google_model', v)} predefinedModels={['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-1.0-pro']} />
                    <CloudKeyBox name="Groq (Llama 3)" icon="GQ" value={settings.ai_provider.groq_key || ''} onChange={(v) => updateProvider('groq_key', v)} onTest={() => handleTestKey('groq', settings.ai_provider.groq_key)} testStatus={apiTestProgress['groq']?.status} testProgress={apiTestProgress['groq']?.progress} testMessage={apiTestProgress['groq']?.message} testDetails={apiTestProgress['groq']?.details} modelValue={settings.ai_provider?.groq_model} onModelChange={(v) => updateProvider('groq_model', v)} predefinedModels={['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']} />
                    <CloudKeyBox name="HuggingFace" icon="HF" value={settings.ai_provider.huggingface_key || ''} onChange={(v) => updateProvider('huggingface_key', v)} onTest={() => handleTestKey('huggingface', settings.ai_provider.huggingface_key)} testStatus={apiTestProgress['huggingface']?.status} testProgress={apiTestProgress['huggingface']?.progress} testMessage={apiTestProgress['huggingface']?.message} testDetails={apiTestProgress['huggingface']?.details} modelValue={settings.ai_provider?.huggingface_model} onModelChange={(v) => updateProvider('huggingface_model', v)} modelPlaceholder="meta-llama/Meta-Llama-3-8B-Instruct" predefinedModels={['meta-llama/Meta-Llama-3-8B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3']} />
                </div>
            </div>

            {/* Paid Cloud APIs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-yellow-500" /> Premium / Paid APIs
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <CloudKeyBox name="OpenAI" icon="OA" value={settings.ai_provider.openai_key || ''} onChange={(v) => updateProvider('openai_key', v)} onTest={() => handleTestKey('openai', settings.ai_provider.openai_key)} testStatus={apiTestProgress['openai']?.status} testProgress={apiTestProgress['openai']?.progress} testMessage={apiTestProgress['openai']?.message} testDetails={apiTestProgress['openai']?.details} modelValue={settings.ai_provider?.openai_model} onModelChange={(v) => updateProvider('openai_model', v)} predefinedModels={['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']} showBaseUrl={true} baseUrlValue={settings.ai_provider?.custom_base_url} onBaseUrlChange={(v) => updateProvider('custom_base_url', v)} />
                    <CloudKeyBox name="Anthropic" icon="AN" value={settings.ai_provider.anthropic_key || ''} onChange={(v) => updateProvider('anthropic_key', v)} onTest={() => handleTestKey('anthropic', settings.ai_provider.anthropic_key)} testStatus={apiTestProgress['anthropic']?.status} testProgress={apiTestProgress['anthropic']?.progress} testMessage={apiTestProgress['anthropic']?.message} testDetails={apiTestProgress['anthropic']?.details} modelValue={settings.ai_provider?.anthropic_model} onModelChange={(v) => updateProvider('anthropic_model', v)} predefinedModels={['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229']} />
                    <CloudKeyBox name="DeepSeek" icon="DS" value={settings.ai_provider.deepseek_key || ''} onChange={(v) => updateProvider('deepseek_key', v)} onTest={() => handleTestKey('deepseek', settings.ai_provider.deepseek_key)} testStatus={apiTestProgress['deepseek']?.status} testProgress={apiTestProgress['deepseek']?.progress} testMessage={apiTestProgress['deepseek']?.message} testDetails={apiTestProgress['deepseek']?.details} modelValue={settings.ai_provider?.deepseek_model} onModelChange={(v) => updateProvider('deepseek_model', v)} predefinedModels={['deepseek-chat', 'deepseek-coder']} />
                    <CloudKeyBox name="OpenRouter" icon="OR" value={settings.ai_provider.openrouter_key || ''} onChange={(v) => updateProvider('openrouter_key', v)} onTest={() => handleTestKey('openrouter', settings.ai_provider.openrouter_key)} testStatus={apiTestProgress['openrouter']?.status} testProgress={apiTestProgress['openrouter']?.progress} testMessage={apiTestProgress['openrouter']?.message} testDetails={apiTestProgress['openrouter']?.details} modelValue={settings.ai_provider?.openrouter_model} onModelChange={(v) => updateProvider('openrouter_model', v)} predefinedModels={['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5']} />
                </div>
            </div>

            {/* Advanced Hardware */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Cpu className="w-5 h-5 mr-2 text-blue-400" /> Advanced Parameters
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">Context Window</label>
                        <input type="number" value={settings.ai_advanced?.context_window || 4096} onChange={(e) => updateAdvanced('context_window', parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">GPU Layers (-1 = All)</label>
                        <input type="number" value={settings.ai_advanced?.gpu_layers || -1} onChange={(e) => updateAdvanced('gpu_layers', parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">CPU Threads</label>
                        <input type="number" value={settings.ai_advanced?.thread_count || 8} onChange={(e) => updateAdvanced('thread_count', parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};
