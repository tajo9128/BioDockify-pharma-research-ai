
'use client';

import dynamic from 'next/dynamic';

const TitleBar = dynamic(() => import('./TitleBar'), {
    ssr: false,
    loading: () => <div className="h-8 bg-slate-950/80 backdrop-blur w-full border-b border-white/5" />
});

export default function TitleBarLoader() {
    return <TitleBar />;
}
