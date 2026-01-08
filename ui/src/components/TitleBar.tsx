'use client';

import React from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, ChevronDown } from 'lucide-react';

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = React.useState(false);

    const toggleMaximize = async () => {
        const max = await appWindow.isMaximized();
        if (max) {
            appWindow.unmaximize();
            setIsMaximized(false);
        } else {
            appWindow.maximize();
            setIsMaximized(true);
        }
    };

    const MenuItem = ({ label }: { label: string }) => (
        <button className="px-3 h-full hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1 rounded-md mx-0.5">
            {label}
        </button>
    );

    return (
        <div data-tauri-drag-region className="fixed top-0 left-0 right-0 h-10 bg-slate-950 flex items-center justify-between z-[60] select-none border-b border-white/5">

            {/* Left: Branding & Menu */}
            <div className="flex items-center px-4 h-full">
                <span className="text-teal-500 font-bold text-sm tracking-wide mr-6 pointer-events-none">Antigravity</span>

                <div className="flex items-center h-6">
                    <MenuItem label="File" />
                    <MenuItem label="Edit" />
                    <MenuItem label="View" />
                </div>
            </div>

            {/* Center: Search/Workspaces Placeholder (from image 2) */}
            <div className="flex-1 max-w-xl mx-4 flex items-center justify-center pointer-events-none opacity-50">
                {/* <div className="h-6 w-full max-w-md bg-slate-900 rounded-md border border-white/10" /> */}
            </div>

            {/* Right: Window Controls */}
            <div className="flex items-center h-full">
                <button
                    onClick={() => appWindow.minimize()}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <Square className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => appWindow.close()}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
