
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Play, Globe } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from '@/lib/api';
import { searchWeb, fetchWebPage } from '@/lib/web_fetcher';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    source?: string;
}

export default function AgentChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hello, I am BioDockify AI. I am your autonomous research assistant. You can ask me to plan experiments, search literature, or explain complex concepts.',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(''); // "Searching...", "Reading..."
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setStatus('Thinking...');

        try {
            // 1. Check Settings for Internet Research
            let context = "";
            let sourceUrl = "";

            // Note: In a real app we'd fetch settings here or have them in context. 
            // For now, assume it's enabled if we detect intent.
            const needsResearch = input.toLowerCase().includes('search') ||
                input.toLowerCase().includes('find') ||
                input.toLowerCase().includes('who') ||
                input.toLowerCase().includes('what is') ||
                input.toLowerCase().includes('latest');

            if (needsResearch) {
                setStatus('Searching Web...');
                const urls = await searchWeb(input);
                if (urls.length > 0) {
                    sourceUrl = urls[0];
                    setStatus(`Reading ${new URL(sourceUrl).hostname}...`);
                    try {
                        const page = await fetchWebPage(sourceUrl);
                        context = `[Context retrieved from Internet (${sourceUrl})]:\n${page.markdown.slice(0, 4000)}\n\n`;
                    } catch (e) {
                        console.warn("Retreival failed", e);
                    }
                }
            }

            // 2. Prepare Prompt
            const finalPrompt = context ? `${context}User Query: ${input}` : input;

            setStatus('Generating Answer...');
            const data = await api.agentChat(finalPrompt);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
                source: sourceUrl ? `Source: ${sourceUrl}` : undefined
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: "Error: Failed to reach BioDockify AI. Please check backend connection.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
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
                <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-full border border-slate-700 transition-colors flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> View Logs
                </button>
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
                                <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</p>
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
