
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Send, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    context?: string; // Debug: Show what context was retrieved
}

export default function NotebookLM() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your Local NotebookLM. Upload your Jupyter Notebooks (.ipynb) or PDFs, and I can answer questions about them.' }
    ]);
    const [input, setInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [sources, setSources] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            // Call API
            // Note: need to extend api.ts to support file upload or use fetch directly
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('http://localhost:8000/api/rag/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setSources(prev => [...prev, file.name]);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ Successfully indexed **${file.name}**. (${data.message})`
            }]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Failed to upload ${file.name}.` }]);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/rag/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                context: data.context // Store context for expandable view
            }]);

        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error chatting with your docs." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!confirm("Clear all indexed knowledge?")) return;
        await fetch('http://localhost:8000/api/rag/clear', { method: 'POST' });
        setSources([]);
        setMessages([{ role: 'assistant', content: 'Knowledge base cleared.' }]);
    };

    return (
        <div className="flex h-screen max-h-[calc(100vh-2rem)] gap-4">
            {/* Sidebar: Sources */}
            <Card className="w-1/4 flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> Sources
                    </CardTitle>
                    <CardDescription>Drag & drop or select files</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Input
                            ref={fileInputRef}
                            id="picture"
                            type="file"
                            accept=".ipynb,.pdf,.md,.txt"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <p className="text-xs text-muted-foreground">Supports .ipynb, .pdf, .txt</p>
                    </div>

                    <Separator />

                    <ScrollArea className="flex-1 border rounded-md p-2">
                        {sources.length === 0 ? (
                            <div className="text-sm text-center text-muted-foreground p-4">
                                No sources added yet.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {sources.map((src, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm bg-secondary/50 p-2 rounded">
                                        <FileText className="w-4 h-4" />
                                        <span className="truncate">{src}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <Button variant="destructive" size="sm" onClick={handleClear} className="mt-auto">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear Knowledge
                    </Button>
                </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 flex flex-col p-4 h-full">
                    {/* Messages */}
                    <ScrollArea className="flex-1 pr-4 mb-4">
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                        }`}>
                                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                                        {msg.context && (
                                            <details className="mt-2 text-xs opacity-70 cursor-pointer">
                                                <summary>View Retrieved Context</summary>
                                                <div className="mt-1 p-2 bg-black/10 rounded font-mono text-[10px] max-h-32 overflow-auto">
                                                    {msg.context}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3 text-sm animate-pulse">Thinking...</div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a question about your documents..."
                            disabled={loading}
                        />
                        <Button onClick={handleSend} disabled={loading || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
