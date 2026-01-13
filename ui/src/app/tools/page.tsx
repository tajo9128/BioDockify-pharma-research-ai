'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ExternalLink, RefreshCw, AlertTriangle, Monitor } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function ToolsPage() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const TOOLS_URL = "http://localhost:8081";

    // Simple health check before showing iframe
    useEffect(() => {
        const checkHealth = async () => {
            try {
                // We'll try to fetch, might fail CORS but if it fails with connection refused we know it's down.
                // Actually typically fetch to localhost from browser works for connectivity check if CORS allows or we handle error.
                // Since it's an opaque request for iframe, we just assume it works if we don't get a strict connection error?
                // Better approach: Just show it and handle load error visually if possible, or use the iframe's onLoad.
                setIsLoaded(true);
            } catch (e) {
                setError(true);
            }
        };
        checkHealth();
    }, []);

    const handleIframeLoad = () => {
        setIsLoaded(true);
        setError(false);
    };

    const handleIframeError = () => {
        setError(true);
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-md tracking-tight">Omni-Tools</h2>
                        <span className="text-xs text-slate-400">Privacy-First Utilities (Local)</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={TOOLS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                        title="Open in new window"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-white">
                {/* Bg white because omni-tools is likely light mode or needs neutrality. 
                   Actually Omni-tools has a dark mode usually. Let's keep slate-950 and see. 
                */}

                {!isLoaded && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
                    </div>
                )}

                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 space-y-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white">Tools Service Unavailable</h3>
                        <p className="text-slate-400 max-w-md text-center">
                            Could not connect to Omni-Tools at <code>localhost:8081</code>.
                            Please make sure the Docker container is running.
                        </p>
                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-sm text-slate-300">
                            cd modules/omni-tools<br />
                            docker-compose up -d
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Retry Connection
                        </button>
                    </div>
                ) : (
                    <iframe
                        src={TOOLS_URL}
                        className="w-full h-full border-none"
                        title="Omni Tools"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        allow="clipboard-read; clipboard-write"
                    />
                )}
            </div>
        </div>
    );
}
