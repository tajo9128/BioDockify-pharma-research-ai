'use client';

import { useState } from 'react';

export default function PharmaceuticalResearchApp() {
    const [activeView, setActiveView] = useState('home');

    return (
        <div className="min-h-screen bg-gradient-orbs relative">
            <div className="ml-20 p-8 relative z-10">
                {activeView === 'home' && (
                    <div>Home Content</div>
                )}
            </div>
        </div>
    );
}
