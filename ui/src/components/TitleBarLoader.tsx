'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import TitleBar with SSR disabled
// This ensures that any window/Tauri APIs used in TitleBar are strictly client-side
const TitleBar = dynamic(() => import('./TitleBar'), {
    ssr: false,
    loading: () => <div className="h-10 bg-slate-950 border-b border-slate-800" /> // Placeholder to prevent layout shift
});

export default function TitleBarLoader() {
    return <TitleBar />;
}
