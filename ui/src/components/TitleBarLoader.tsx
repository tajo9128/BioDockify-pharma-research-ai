'use client';

import dynamic from 'next/dynamic';

const TitleBar = dynamic(() => import('./TitleBar'), { ssr: false });

export default function TitleBarLoader() {
    return <TitleBar />;
}
