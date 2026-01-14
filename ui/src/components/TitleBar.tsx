'use client';

import React, { useState, useEffect, useRef } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, FolderOpen, FileText, Settings, Type, ZoomIn, ZoomOut, Eye, BookOpen, Mail, Activity } from 'lucide-react';

interface MenuItemConfig {
    label?: string;
    icon?: any;
    action?: () => void;
    divider?: boolean;
}

export default function TitleBar() {
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const handleMinimize = () => appWindow.minimize();
    const toggleMaximize = async () => {
        const isMax = await appWindow.isMaximized();
        if (isMax) {
            appWindow.unmaximize();
        } else {
            appWindow.maximize();
        }
    };
    const handleClose = () => {
        if (typeof window !== 'undefined') {
            appWindow.close();
        }
    };

    const handleFileImport = async (type: string) => {
        try {
            const { open } = await import('@tauri-apps/api/dialog');
            let extensions: string[] = [];
            let filterName = '';

            switch (type) {
                case 'pdf':
                    extensions = ['pdf'];
                    filterName = 'PDF Documents';
                    break;
                case 'doc':
                    extensions = ['doc', 'docx'];
                    filterName = 'Word Documents';
                    break;
                case 'text':
                    extensions = ['txt', 'md'];
                    filterName = 'Text Files';
                    break;
                case 'notebook':
                    extensions = ['ipynb'];
                    filterName = 'Jupyter Notebooks';
                    break;
                case 'data':
                    extensions = ['csv', 'json'];
                    filterName = 'Data Files';
                    break;
                case 'all':
                    extensions = ['pdf', 'doc', 'docx', 'txt', 'md', 'ipynb', 'csv', 'json'];
                    filterName = 'All Supported Files';
                    break;
            }

            const selected = await open({
                multiple: true,
                filters: [{ name: filterName, extensions }]
            });
            if (selected) {
                console.log(`Importing ${type} files:`, selected);
                window.dispatchEvent(new CustomEvent('import-to-notebook', { detail: { files: selected, type } }));
            }
        } catch (e) {
            console.error('File import failed:', e);
        }
    };

    const fileMenuItems: MenuItemConfig[] = [
        { label: 'Import Any File to Notebook', icon: FileText, action: () => handleFileImport('all') },
        { divider: true, label: 'Import PDF', icon: FileText, action: () => handleFileImport('pdf') },
        { label: 'Import Word Document', icon: FileText, action: () => handleFileImport('doc') },
        { label: 'Import Text/Markdown', icon: FileText, action: () => handleFileImport('text') },
        { label: 'Import Jupyter Notebook', icon: FileText, action: () => handleFileImport('notebook') },
        { label: 'Import Data (CSV/JSON)', icon: FileText, action: () => handleFileImport('data') },
        { divider: true, label: 'Open Settings', icon: Settings, action: () => window.dispatchEvent(new CustomEvent('navigate-to-settings')) },
        { divider: true, label: 'Exit', action: handleClose },
    ];

    const editMenuItems: MenuItemConfig[] = [
        { label: 'Copy', action: () => document.execCommand('copy') },
        { label: 'Paste', action: () => document.execCommand('paste') },
        { divider: true, label: 'Settings', icon: Settings, action: () => window.dispatchEvent(new CustomEvent('navigate-to-settings')) },
    ];

    const viewMenuItems: MenuItemConfig[] = [
        {
            label: 'Zoom In', icon: ZoomIn, action: () => {
                const root = document.documentElement;
                const current = parseFloat(getComputedStyle(root).getPropertyValue('--app-zoom') || '1');
                root.style.setProperty('--app-zoom', String(Math.min(current + 0.1, 1.5)));
                document.body.style.transform = `scale(var(--app-zoom, 1))`;
                document.body.style.transformOrigin = 'top left';
            }
        },
        {
            label: 'Zoom Out', icon: ZoomOut, action: () => {
                const root = document.documentElement;
                const current = parseFloat(getComputedStyle(root).getPropertyValue('--app-zoom') || '1');
                root.style.setProperty('--app-zoom', String(Math.max(current - 0.1, 0.7)));
                document.body.style.transform = `scale(var(--app-zoom, 1))`;
                document.body.style.transformOrigin = 'top left';
            }
        },
        {
            label: 'Reset Zoom', icon: Eye, action: () => {
                document.documentElement.style.setProperty('--app-zoom', '1');
                document.body.style.transform = 'scale(1)';
            }
        },
        { divider: true, label: 'Toggle Fullscreen', icon: Eye, action: toggleMaximize },
    ];

    // Helper Component for Menu Item
    const MenuItem = ({ label, items }: { label: string; items: MenuItemConfig[] }) => {
        const isOpen = openMenu === label;

        return (
            <div className="relative z-[70]">
                <button
                    className={`px-3 h-full text-xs font-medium transition-colors hover:bg-slate-800 flex items-center ${isOpen ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(isOpen ? null : label);
                    }}
                    onMouseEnter={() => {
                        if (openMenu) setOpenMenu(label);
                    }}
                >
                    {label}
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[70]"
                            onClick={() => setOpenMenu(null)}
                        />
                        <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-lg min-w-[200px] z-[80] overflow-hidden py-1">
                            {items.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    {item.divider && <div className="h-px bg-slate-700 my-1 mx-2" />}
                                    {item.label && (
                                        <button
                                            onClick={() => {
                                                item.action?.();
                                                setOpenMenu(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-teal-500/10 hover:text-teal-400 transition-colors flex items-center gap-2 group"
                                        >
                                            {item.icon && <item.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400" />}
                                            {item.label}
                                        </button>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="fixed top-0 left-0 right-0 h-10 bg-slate-950 flex items-center justify-between z-[60] select-none border-b border-white/5 shadow-sm">
            {/* Left: Branding & Menu */}
            <div className="flex items-center px-4 h-full">
                <span data-tauri-drag-region className="text-teal-500 font-bold text-sm tracking-wide mr-6 pointer-events-none flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    BioDockify
                </span>

                <div className="flex items-center h-full gap-1">
                    <MenuItem label="File" items={fileMenuItems} />
                    <MenuItem label="Edit" items={editMenuItems} />
                    <MenuItem label="View" items={viewMenuItems} />
                    <MenuItem label="Help" items={[
                        { label: 'Documentation', icon: BookOpen, action: () => window.open('https://biodockify.com/docs', '_blank') },
                        { divider: true },
                        { label: 'Run System Diagnostics', icon: Activity, action: () => window.dispatchEvent(new CustomEvent('trigger-diagnostics')) },
                        { label: 'Send Feedback', icon: Mail, action: () => window.dispatchEvent(new CustomEvent('open-feedback')) }
                    ]} />
                </div>
            </div>

            {/* Center: Draggable Area */}
            <div data-tauri-drag-region className="flex-1 max-w-xl mx-4 flex items-center justify-center h-full">
                {/* Empty draggable space */}
            </div>

            {/* Right: Window Controls */}
            <div className="flex items-center h-full pointer-events-auto">
                <button
                    onClick={handleMinimize}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                    <Minus className="w-4 h-4 pointer-events-none" />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                    <Square className="w-3.5 h-3.5 pointer-events-none" />
                </button>
                <button
                    onClick={handleClose}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4 pointer-events-none" />
                </button>
            </div>
        </div>
    );
}
