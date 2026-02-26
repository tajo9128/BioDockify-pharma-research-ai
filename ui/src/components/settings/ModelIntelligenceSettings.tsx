import React, { useState } from 'react';
import { CheckCircle, XCircle, Globe, Server, Cpu, Cloud } from 'lucide-react';
import { Settings, api } from '../../lib/api';

interface ModelIntelligenceSettingsProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
}

export function ModelIntelligenceSettings({ settings, onUpdate }: ModelIntelligenceSettingsProps) {
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'success' | 'failure' | null>(null);

    // Safe access to ai_provider with defaults
    const aiProvider = settings?.ai_provider || {};

    const handleChange = (field: string, value: any) => {
        // If changing mode, we might want to set some defaults
        if (field === 'ai_provider.mode') {
            const newSettings = { ...settings };
            const updatedAi = { ...aiProvider, mode: value };

            // Merge specific model defaults if needed
            if (value === 'venice') {
                updatedAi.venice_model = updatedAi.venice_model || 'llama-3-70b';
            } else if (value === 'mistral') {
                updatedAi.mistral_model = updatedAi.mistral_model || 'mistral-large-latest';
            } else if (value === 'kimi') {
                updatedAi.kimi_model = updatedAi.kimi_model || 'moonshot-v1-8k';
            }

            onUpdate({ ...settings, ai_provider: updatedAi });
            return;
        }

        const parts = field.split('.');
        if (parts.length === 2 && parts[0] === 'ai_provider') {
            onUpdate({
                ...settings,
                ai_provider: {
                    ...aiProvider,
                    [parts[1]]: value
                }
            });
        }
    };

    const handleTest = async () => {
        setTestingConnection(true);
        setConnectionStatus(null);
        try {
            const result = await api.testConnection(aiProvider);
            setConnectionStatus(result.success ? 'success' : 'failure');
            if (!result.success) {
                alert(`Connection Failed: ${result.message}`);
            }
        } catch (error) {
            setConnectionStatus('failure');
            alert("Connection validation failed due to network error.");
        } finally {
            setTestingConnection(false);
        }
    };

    const mode = aiProvider.mode || 'openai';

    return (
        <div className="space-y-8">

            {/* ---------------------------------------------------------------------------
          Universal Provider Selection
         --------------------------------------------------------------------------- */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-slate-200">Primary AI Provider</h3>
                        <p className="text-sm text-slate-400">Select the intelligence engine for BioDockify.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 max-w-2xl">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Provider</label>
                        <select
                            value={mode}
                            onChange={(e) => handleChange('ai_provider.mode', e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <optgroup label="Cloud Intelligence (Recommended)">
                                <option value="openai">OpenAI (GPT-4 / GPT-3.5)</option>
                                <option value="anthropic">Anthropic (Claude 3)</option>
                                <option value="google">Google (Gemini Pro)</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="mistral">Mistral AI</option>
                                <option value="venice">Venice.ai (Privacy First)</option>
                                <option value="glm">Zhipu AI (GLM-4)</option>
                                <option value="kimi">Moonshot AI (Kimi)</option>
                                <option value="openrouter">OpenRouter (Aggregator)</option>
                                <option value="huggingface">HuggingFace Inference</option>
                                <option value="groq">Groq (Ultra-Fast)</option>
                            </optgroup>
                            <optgroup label="Enterprise Cloud">
                                <option value="azure">Azure OpenAI Service</option>
                                <option value="aws">AWS Bedrock</option>
                            </optgroup>
                            <optgroup label="Local Intelligence">
                                <option value="lm_studio">LM Studio (Localhost)</option>
                                <option value="ollama">Ollama (Localhost)</option>
                            </optgroup>
                            <optgroup label="Custom">
                                <option value="custom">Custom OpenAI-Compatible</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* 
                DYNAMIC FIELD RENDERING BASED ON MODE 
            */}

                    {/* --- OpenAI --- */}
                    {mode === 'openai' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">API Key</label>
                                <input
                                    type="password"
                                    value={aiProvider.openai_key || ''}
                                    onChange={(e) => handleChange('ai_provider.openai_key', e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </>
                    )}

                    {/* --- Anthropic --- */}
                    {mode === 'anthropic' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Anthropic API Key</label>
                            <input
                                type="password"
                                value={aiProvider.anthropic_key || ''}
                                onChange={(e) => handleChange('ai_provider.anthropic_key', e.target.value)}
                                placeholder="sk-ant-..."
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {/* --- Google --- */}
                    {mode === 'google' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Google AI Studio Key</label>
                            <input
                                type="password"
                                value={aiProvider.google_key || ''}
                                onChange={(e) => handleChange('ai_provider.google_key', e.target.value)}
                                placeholder="AIza..."
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {/* --- Azure OpenAI --- */}
                    {mode === 'azure' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Endpoint URL</label>
                                <input
                                    type="text"
                                    value={aiProvider.azure_endpoint || ''}
                                    onChange={(e) => handleChange('ai_provider.azure_endpoint', e.target.value)}
                                    placeholder="https://my-resource.openai.azure.com/"
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Deployment Name</label>
                                <input
                                    type="text"
                                    value={aiProvider.azure_deployment || ''}
                                    onChange={(e) => handleChange('ai_provider.azure_deployment', e.target.value)}
                                    placeholder="gpt-4-deployment"
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">API Key</label>
                                <input
                                    type="password"
                                    value={aiProvider.azure_key || ''}
                                    onChange={(e) => handleChange('ai_provider.azure_key', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">API Version</label>
                                <input
                                    type="text"
                                    value={aiProvider.azure_api_version || '2024-02-15-preview'}
                                    onChange={(e) => handleChange('ai_provider.azure_api_version', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* --- AWS Bedrock --- */}
                    {mode === 'aws' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">New: Identity-less Auth?</label>
                                <p className="text-xs text-slate-400">If running on AWS Infra, keys may be optional. Otherwise provide below.</p>
                            </div>
                            <div className="space-y-2 md:col-span-2"></div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Access Key ID</label>
                                <input
                                    type="text"
                                    value={aiProvider.aws_access_key || ''}
                                    onChange={(e) => handleChange('ai_provider.aws_access_key', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Secret Access Key</label>
                                <input
                                    type="password"
                                    value={aiProvider.aws_secret_key || ''}
                                    onChange={(e) => handleChange('ai_provider.aws_secret_key', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Region</label>
                                <input
                                    type="text"
                                    value={aiProvider.aws_region_name || 'us-east-1'}
                                    onChange={(e) => handleChange('ai_provider.aws_region_name', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Model ID</label>
                                <input
                                    type="text"
                                    value={aiProvider.aws_model_id || 'anthropic.claude-3-sonnet-20240229-v1:0'}
                                    onChange={(e) => handleChange('ai_provider.aws_model_id', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* --- Mistral / Venice / DeepSeek / Kimi / GLM / OpenRouter / Groq / HuggingFace (Standard Key + Model + Base URL for some) --- */}
                    {['mistral', 'venice', 'deepseek', 'kimi', 'glm', 'openrouter', 'groq', 'huggingface'].includes(mode) && (
                        <div className="space-y-4">
                            {(mode === 'deepseek' || mode === 'openrouter' || mode === 'groq' || mode === 'huggingface') && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Base URL</label>
                                    <input
                                        type="text"
                                        value={(aiProvider as any)[`${mode}_base_url`] || ''}
                                        onChange={(e) => handleChange(`ai_provider.${mode}_base_url`, e.target.value)}
                                        placeholder={mode === 'deepseek' ? 'https://api.deepseek.com/v1' : mode === 'openrouter' ? 'https://openrouter.ai/v1' : mode === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api-inference.huggingface.co'}
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">API Key</label>
                                <input
                                    type="password"
                                    // Map generic key field based on mode
                                    value={(aiProvider as any)[`${mode}_key`] || ''}
                                    onChange={(e) => handleChange(`ai_provider.${mode}_key`, e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Model Name (Optional)</label>
                                <input
                                    type="text"
                                    value={(aiProvider as any)[`${mode}_model`] || ''}
                                    onChange={(e) => handleChange(`ai_provider.${mode}_model`, e.target.value)}
                                    placeholder={mode === 'deepseek' ? 'deepseek-chat' : mode === 'mistral' ? 'mistral-large-latest' : mode === 'venice' ? 'llama-3-70b' : 'default'}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* --- LM Studio --- */}
                    {mode === 'lm_studio' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400">Ensure LM Studio is running and the &quot;Local Inference Server&quot; is started.</p>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Base URL</label>
                                <input
                                    type="text"
                                    value={aiProvider.lm_studio_url || 'http://localhost:1234/v1'}
                                    onChange={(e) => handleChange('ai_provider.lm_studio_url', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Model ID</label>
                                <input
                                    type="text"
                                    value={aiProvider.lm_studio_model || ''}
                                    onChange={(e) => handleChange('ai_provider.lm_studio_model', e.target.value)}
                                    placeholder="auto"
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-slate-500">Leave as &apos;auto&apos; to use the loaded model</p>
                            </div>
                        </div>
                    )}

                    {/* --- Custom --- */}
                    {mode === 'custom' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Base URL</label>
                                <input
                                    type="text"
                                    value={aiProvider.custom_base_url || ''}
                                    onChange={(e) => handleChange('ai_provider.custom_base_url', e.target.value)}
                                    placeholder="https://api.example.com/v1"
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">API Key</label>
                                <input
                                    type="password"
                                    value={aiProvider.custom_key || ''}
                                    onChange={(e) => handleChange('ai_provider.custom_key', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Model Name</label>
                                <input
                                    type="text"
                                    value={aiProvider.custom_model || ''}
                                    onChange={(e) => handleChange('ai_provider.custom_model', e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}


                    <div className="pt-4 flex items-center justify-between border-t border-slate-800 mt-4">
                        <button
                            onClick={handleTest}
                            disabled={testingConnection}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connectionStatus === 'success'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : connectionStatus === 'failure'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                        >
                            {testingConnection ? 'Testing Connection...' :
                                connectionStatus === 'success' ? 'Connection Verified' :
                                    'Test Connection'}
                        </button>
                        {connectionStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {connectionStatus === 'failure' && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                </div>
            </div>
        </div>
    );
}
