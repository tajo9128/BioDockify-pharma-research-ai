'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Play, Globe, ShieldAlert, Brain, Wrench, Power, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from '@/lib/api';
import { searchWeb, fetchWebPage } from '@/lib/web_fetcher';
import { getPersonaById } from '@/lib/personas';
import DiagnosisDialog from '@/components/DiagnosisDialog';
import DeepResearchPanel from '@/components/DeepResearchPanel';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    source?: string;
    thoughts?: string[];
    action?: any;
}

interface ServiceHealth {
    backend: 'checking' | 'online' | 'offline';
    lmStudio: 'checking' | 'online' | 'offline' | 'no_model';
}

const REPAIR_TRIGGERS = [
    'fix the system',
    'repair agent zero',
    'diagnose and repair',
    'recover ai services',
    'chat not working',
    'fix chat',
    'system health',
    'repair system'
];

const DEEP_RESEARCH_TRIGGERS = [
    'deep research',
    'research plan',
    'generate podcast',
    'audio briefing',
    'analyzing complex'
];

export default function AgentChat() {
    // Import introduction dynamically to support first-time vs returning user logic
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `**Hello.**

I am **BioDockify AI**, an intelligent research assistant designed for pharmaceutical and life-science research.

I am built to **analyze research**, not merely generate text, and to **automate repetitive academic tasks** while preserving scientific rigor.

**Core Capabilities:**
• Deep Literature Analysis (comparative analysis, gap detection)
• Automatic Literature Review Workflow
• Evidence-Driven Research Analysis
• Project Memory & Research Continuity
• Academic Writing Support

**How to Start:**
• Upload research papers
• State your research topic
• Ask me to search literature

*BioDockify AI analyzes research and automates academic workflows — it does not merely generate text.*

How can I assist your research today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(''); // "Searching...", "Reading..."
    const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(false);
    const [deepResearchQuery, setDeepResearchQuery] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Health monitoring state
    const [health, setHealth] = useState<ServiceHealth>({
        backend: 'checking',
        lmStudio: 'checking'
    });
    const [isStartingServices, setIsStartingServices] = useState(false);

    // Health check function
    const checkHealth = useCallback(async () => {
        // Check backend
        try {
            const res = await fetch('http://localhost:8234/health', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            setHealth(h => ({ ...h, backend: res.ok ? 'online' : 'offline' }));
        } catch {
            setHealth(h => ({ ...h, backend: 'offline' }));
        }

        // Check LM Studio
        try {
            const res = await fetch('http://localhost:1234/v1/models', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            if (res.ok) {
                const data = await res.json();
                const hasModels = (data.data || []).length > 0;
                setHealth(h => ({ ...h, lmStudio: hasModels ? 'online' : 'no_model' }));
            } else {
                setHealth(h => ({ ...h, lmStudio: 'offline' }));
            }
        } catch {
            setHealth(h => ({ ...h, lmStudio: 'offline' }));
        }
    }, []);

    // Start services manually
    const handleStartServices = async () => {
        setIsStartingServices(true);

        // If in Tauri, try to start backend
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            try {
                const { Command } = await import('@tauri-apps/api/shell');
                // Use the robust launcher
                const cmd = new Command('cmd', ['/c', 'start', '/b', '.venv\\Scripts\\python.exe', 'backend_launcher.py']);
                await cmd.execute();
            } catch (e) {
                console.error('Failed to start backend:', e);
            }
        }

        // Wait and recheck
        await new Promise(r => setTimeout(r, 5000));
        await checkHealth();
        setIsStartingServices(false);
    };

    // Initial health check and periodic monitoring
    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, [checkHealth]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Check if we should prompt for API keys on first use
    const checkFirstTimeApiPrompt = async () => {
        if (typeof window === 'undefined') return;

        const hasPrompted = localStorage.getItem('biodockify_api_prompt_shown');
        if (hasPrompted) return;

        try {
            const settings = await api.getSettings();
            const providerConfig = settings?.ai_provider || {};

            // Check if any CLOUD provider is configured
            const hasCloudProvider = !!(
                providerConfig.google_key ||
                providerConfig.openrouter_key ||
                providerConfig.huggingface_key ||
                providerConfig.custom_key ||
                providerConfig.glm_key ||
                providerConfig.groq_key ||
                providerConfig.openai_key
            );

            // If no cloud provider, suggest adding one for full potential
            if (!hasCloudProvider) {
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `🚀 **Unlock Full Research Potential**
                    
While you can run locally, adding a **Free or Paid API Key** unlocks:
• **Deep Research Mode** (Analyze 100+ papers)
• **Academic Writing Assistant** (Higher quality drafts)
• **Complex Reasoning** (Better gap detection)

**Recommended Free Options:**
• **Google Gemini** (High capacity, great for research)
• **Groq** (Extremely fast)

*Go to Settings → AI & Brain to configure.*`,
                    timestamp: new Date()
                }]);
            }

            localStorage.setItem('biodockify_api_prompt_shown', 'true');
        } catch (e) {
            console.error('Failed to check API settings:', e);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        // Check for first-time API prompt
        await checkFirstTimeApiPrompt();

        // Check if any AI provider is configured (including LM Studio)
        try {
            const settings = await api.getSettings();
            const providerConfig = settings?.ai_provider || {};

            // Check for cloud providers
            const hasCloudProvider = !!(
                providerConfig.google_key ||
                providerConfig.openrouter_key ||
                providerConfig.huggingface_key ||
                providerConfig.custom_key ||
                providerConfig.glm_key ||
                providerConfig.groq_key
            );

            // Check for LM Studio (local AI)
            const rawLmUrl = providerConfig.lm_studio_url || 'http://localhost:1234/v1/models';
            const baseLmUrl = rawLmUrl.replace(/\/models\/?$/, ''); // Strip /models for safety

            let hasLmStudio = false;

            if (providerConfig.mode === 'lm_studio' || !hasCloudProvider) {
                try {
                    const { universalFetch } = await import('@/lib/services/universal-fetch');
                    const lmCheck = await universalFetch(`${baseLmUrl}/models`, {
                        method: 'GET',
                        timeout: 3000
                    });
                    hasLmStudio = lmCheck.ok && lmCheck.data?.data?.length > 0;
                } catch (e) {
                    console.log('[AgentChat] LM Studio check failed:', e);
                }
            }

            // If no provider available, show helpful message
            if (!hasCloudProvider && !hasLmStudio) {
                const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
                setMessages(prev => [...prev, userMsg]);
                setInput('');

                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `⚠️ **No AI Provider Available**

**LM Studio** is not running or no model is loaded.

**Quick Fix Options:**

**Option 1: Use LM Studio (Recommended for privacy)**
1. Open LM Studio application
2. Load any model (e.g., Llama, Mistral, Qwen)
3. Enable "Local Server" (port 1234)
4. Try again

**Option 2: Use Free Cloud API**
Go to **Settings → AI & Brain** and add one of these free APIs:
• **Google Gemini** - https://ai.google.dev/
• **Groq** - https://console.groq.com/keys
• **HuggingFace** - https://huggingface.co/settings/tokens

After configuring, try again.`,
                    timestamp: new Date()
                }]);
                return;
            }
        } catch (e) {
            console.warn("Failed to check provider configuration:", e);
        }

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        const lowerInput = userMsg.content.toLowerCase();

        // 0.5 Check for Deep Research Trigger
        if (DEEP_RESEARCH_TRIGGERS.some(trigger => lowerInput.includes(trigger))) {
            setDeepResearchQuery(userMsg.content);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Initializing Deep Research Agent with SurfSense architecture...',
                timestamp: new Date()
            }]);
            return;
        }

        setIsLoading(true);
        setStatus('Thinking...');

        try {
            // 1. Check Settings for Internet Research
            let context = "";
            let sourceUrl = "";
            const needsResearch = lowerInput.includes('search') ||
                lowerInput.includes('find') ||
                lowerInput.includes('who') ||
                lowerInput.includes('what is') ||
                lowerInput.includes('latest');

            if (needsResearch) {
                setStatus('Searching Web...');
                const urls = await searchWeb(input);
                if (urls.length > 0) {
                    sourceUrl = urls[0];
                    setStatus(`Reading ${new URL(sourceUrl).hostname}...`);
                    try {
                        const page = await fetchWebPage(sourceUrl);
                        context = `[Context retrieved from Internet (${sourceUrl})]:\n${page.textContent.slice(0, 4000)}\n\n`;
                    } catch (e) {
                        console.warn("Retreival failed", e);
                    }
                }
            }

            // 2. Prepare Prompt with Persona
            let systemInstruction = "";
            try {
                const settings = await api.getSettings();
                const roleId = settings?.persona?.role || 'pg_student';
                const persona = getPersonaById(roleId);
                systemInstruction = `[SYSTEM]: ${persona.systemPrompt}\n\n`;
            } catch (e) {
                console.warn("Failed to load persona", e);
            }

            const finalPrompt = `${systemInstruction}${context}User Query: ${input}`;

            setStatus('Generating Answer...');
            const data = await api.agentChat(finalPrompt);

            // Agent Zero JSON Parsing Logic
            let replyContent = data.reply;
            let thoughts: string[] | undefined;
            let action: any | undefined;

            try {
                // Try to parse the response as Agent Zero JSON Structure
                // The prompt enforces: { "thoughts": [], "headline": "", "action": {} }
                if (data.reply.trim().startsWith('{')) {
                    const parsed = JSON.parse(data.reply);
                    if (parsed.thoughts || parsed.headline) {
                        thoughts = parsed.thoughts;
                        replyContent = parsed.headline || parsed.action?.name || "Action executed.";
                        action = parsed.action;

                        // If there is text in the action arguments, maybe use that as content?
                        // For now, headline is the summary.
                    }
                }
            } catch (e) {
                // Fallback to raw text if not JSON
                console.log("Response was not JSON, using raw text", e);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: replyContent,
                thoughts: thoughts,
                action: action,
                timestamp: new Date(),
                source: sourceUrl ? `Source: ${sourceUrl}` : undefined
            }]);

        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'system',
                content: `⚠️ **Connection Error**
                
Failed to reach the BioDockify Research Backend.

**Troubleshooting:**
1. Click **"Start Services"** or **"Self Repair"** in the top bar.
2. If manually starting, run \`backend_launcher.py\` instead of server.py.
3. Check if your antivirus is blocking port 8234.

*You can still browse your previous chats, but new messages require the backend.*`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans relative">
            <DiagnosisDialog
                isOpen={isDiagnosisOpen}
                onClose={() => setIsDiagnosisOpen(false)}
            />

            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight">BioDockify AI</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs text-slate-400">Online • Role: Research Assistant</span>
                        </div>
                    </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Health Status Indicator */}
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700 text-xs">
                        {/* Backend Status */}
                        <div className="flex items-center gap-1" title={`Backend: ${health.backend}`}>
                            {health.backend === 'online' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : health.backend === 'checking' ? (
                                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                            ) : (
                                <AlertCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className="text-slate-400">API</span>
                        </div>
                        <span className="text-slate-600">|</span>
                        {/* LM Studio Status */}
                        <div className="flex items-center gap-1" title={`LM Studio: ${health.lmStudio}`}>
                            {health.lmStudio === 'online' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : health.lmStudio === 'no_model' ? (
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                            ) : health.lmStudio === 'checking' ? (
                                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                            ) : (
                                <AlertCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className="text-slate-400">LM</span>
                        </div>
                    </div>

                    {/* Start Services Button - Show when offline */}
                    {(health.backend === 'offline' || health.lmStudio === 'offline') && (
                        <button
                            onClick={handleStartServices}
                            disabled={isStartingServices}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                            title="Start Backend Services"
                        >
                            {isStartingServices ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Power className="w-3 h-3" />
                            )}
                            {isStartingServices ? 'Starting...' : 'Start Services'}
                        </button>
                    )}

                    {/* Refresh Health Button */}
                    <button
                        onClick={checkHealth}
                        className="p-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 rounded-full border border-slate-700 transition-colors"
                        title="Refresh Health Status"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>

                    <button
                        onClick={() => setIsDiagnosisOpen(true)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30 transition-colors flex items-center gap-2"
                        title="Run System Diagnosis"
                    >
                        <Wrench className="w-3 h-3" /> Self Repair
                    </button>
                    <button
                        onClick={() => setDeepResearchQuery("New Research")}
                        className="px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium rounded-full border border-indigo-500/30 transition-colors flex items-center gap-2"
                        title="Start Deep Research"
                    >
                        <Brain className="w-3 h-3" /> Deep Research
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role !== 'user' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                {msg.role === 'system' ? <Terminal className="w-4 h-4 text-red-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                            </div>
                        )}

                        <div className={`max-w-[75%] space-y-1`}>
                            <div className={`p-4 rounded-2xl ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                : msg.role === 'system'
                                    ? 'bg-red-900/20 border border-red-900/50 text-red-200'
                                    : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm'
                                }`}>
                                {/* Agent Zero: Thoughts Section */}
                                {msg.thoughts && msg.thoughts.length > 0 && (
                                    <div className="mb-3 p-3 bg-black/20 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                            <Brain className="w-3 h-3" /> Thinking Process
                                        </div>
                                        <ul className="list-disc list-outside ml-4 space-y-1 text-xs font-mono text-slate-400">
                                            {msg.thoughts.map((t, i) => (
                                                <li key={i}>{t}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</p>

                                {/* Agent Zero: Action Section */}
                                {msg.action && (
                                    <div className="mt-3 text-xs bg-indigo-500/10 text-indigo-200 p-2 rounded border border-indigo-500/20 flex items-center gap-2">
                                        <Terminal className="w-3 h-3" />
                                        <span className="font-mono">Executed: {msg.action.name}</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-600 px-1 opacity-100">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-4 h-4 text-slate-400" />
                            </div>
                        )}
                    </div>
                ))}

                {deepResearchQuery && (
                    <div className="mb-6">
                        <DeepResearchPanel
                            query={deepResearchQuery}
                            onClose={() => setDeepResearchQuery(null)}
                        />
                    </div>
                )}

                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-1 h-10 px-4 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-6 pt-2 bg-slate-950">
                <div className="relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask BioDockify AI..."
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 pl-5 pr-14 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-xl"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                    <span>Model: {isLoading ? 'Busy' : 'Ready'}</span>
                    <span>•</span>
                    <span>Tools: Enabled</span>
                </div>
            </div>
        </div>
    );
}
