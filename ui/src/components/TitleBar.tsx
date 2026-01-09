'use client';

import React from 'react';
import { Minus, Square, X, Settings, FileText, Download, Eye, ZoomIn, ZoomOut } from 'lucide-react';

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = React.useState(false);
    const [isClient, setIsClient] = React.useState(false);
    const [openMenu, setOpenMenu] = React.useState<string | null>(null);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="fixed top-0 left-0 right-0 h-10 bg-slate-950 border-b border-white/5 z-[60]" />;
    }

    const toggleMaximize = async () => {
        try {
            const { appWindow } = await import('@tauri-apps/api/window');
            const max = await appWindow.isMaximized();
            if (max) {
                appWindow.unmaximize();
                setIsMaximized(false);
            } else {
                appWindow.maximize();
                setIsMaximized(true);
            }
        } catch (e) {
            console.error('Failed to toggle maximize', e);
        }
    };

    const handleMinimize = async () => {
        try {
            const { appWindow } = await import('@tauri-apps/api/window');
            appWindow.minimize();
        } catch (e) {
            console.error('Failed to minimize', e);
        }
    };

    const handleClose = async () => {
        try {
            const { appWindow } = await import('@tauri-apps/api/window');
            appWindow.close();
        } catch (e) {
            console.error('Failed to close', e);
        }
    };

    const MenuItem = ({ label, items }: { label: string; items: Array<{ label: string; icon?: any; action: () => void; divider?: boolean }> }) => {
        const isOpen = openMenu === label;

        return (
            <div className="relative">
                <button
                    onClick={() => setOpenMenu(isOpen ? null : label)}
                    onMouseEnter={() => openMenu && setOpenMenu(label)}
                    className={`px-3 h-full hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1 rounded-md mx-0.5 pointer-events-auto cursor-pointer ${isOpen ? 'bg-white/10' : ''}`}
                >
                    {label}
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[70]"
                            onClick={() => setOpenMenu(null)}
                        />
                        <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-lg min-w-[180px] z-[80] overflow-hidden">
                            {items.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    {item.divider && <div className="h-px bg-slate-700 my-1" />}
                                    <button
                                        onClick={() => {
                                            item.action();
                                            setOpenMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        {item.icon && <item.icon className="w-3.5 h-3.5" />}
                                        {item.label}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const fileMenuItems = [
        { label: 'New Research', icon: FileText, action: () => console.log('New Research') },
        { label: 'Open Settings', icon: Settings, action: () => window.dispatchEvent(new CustomEvent('navigate-to-settings')) },
        { divider: true, label: 'Export Results', icon: Download, action: () => console.log('Export') },
        { label: 'Exit', action: handleClose },
    ];

    const editMenuItems = [
        { label: 'Copy', action: () => document.execCommand('copy') },
        { label: 'Paste', action: () => document.execCommand('paste') },
        { divider: true, label: 'Settings', icon: Settings, action: () => window.dispatchEvent(new CustomEvent('navigate-to-settings')) },
    ];

    const viewMenuItems = [
        { label: 'Zoom In', icon: ZoomIn, action: () => console.log('Zoom In') },
        { label: 'Zoom Out', icon: ZoomOut, action: () => console.log('Zoom Out') },
        { divider: true, label: 'Toggle Fullscreen', icon: Eye, action: toggleMaximize },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 h-10 bg-slate-950 flex items-center justify-between z-[60] select-none border-b border-white/5">

            {/* Left: Branding & Menu */}
            <div className="flex items-center px-4 h-full">
                <span data-tauri-drag-region className="text-teal-500 font-bold text-sm tracking-wide mr-6 pointer-events-none">BioDockify</span>

                <div className="flex items-center h-full">
                    <MenuItem label="File" items={fileMenuItems} />
                    <MenuItem label="Edit" items={editMenuItems} />
                    <MenuItem label="View" items={viewMenuItems} />
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
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors pointer-events-auto cursor-pointer"
                >
                    <Minus className="w-4 h-4 pointer-events-none" />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors pointer-events-auto cursor-pointer"
                >
                    <Square className="w-3.5 h-3.5 pointer-events-none" />
                </button>
                <button
                    onClick={handleClose}
                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors pointer-events-auto cursor-pointer"
                >
                    <X className="w-4 h-4 pointer-events-none" />
                </button>
            </div>
        </div>
    );
}
