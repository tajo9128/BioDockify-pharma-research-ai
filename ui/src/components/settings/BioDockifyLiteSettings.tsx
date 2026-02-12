
import React from 'react';
import { useSettings } from '../../hooks/useSettings';

interface Settings {
    nanobot?: {
        headless_browser?: boolean;
        stealth_mode?: boolean;
        browser_timeout?: number;
        // Add other properties as needed
    };
    // Add other setting groups
}

export default function BioDockifyLiteSettings() {
    const { settings, updateSettings } = useSettings();

    // Type assertion
    const safeSettings = settings as Settings;

    const updateLite = (key: string, value: any) => {
        updateSettings('nanobot', {
            ...(safeSettings.nanobot || {}),
            [key]: value
        });
    };

    const headlessBrowser = safeSettings.nanobot?.headless_browser || false;
    const stealthMode = safeSettings.nanobot?.stealth_mode || false;
    const browserTimeout = safeSettings.nanobot?.browser_timeout || 30;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">BioDockify AI Lite</h2>
                <p className="text-slate-400">Configure the Coordinator Agent. This agent handles browser automation, data fetching, and rapid task execution.</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-6">
                <h3 className="text-lg font-semibold text-emerald-400">Browser Automation</h3>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-slate-200 font-medium">Headless Mode</label>
                        <p className="text-xs text-slate-500">Run browser in background (faster, less visible)</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={headlessBrowser}
                        onChange={(e) => updateLite('headless_browser', e.target.checked)}
                        className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-slate-200 font-medium">Stealth Mode</label>
                        <p className="text-xs text-slate-500">Evade bot detection on academic sites</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={stealthMode}
                        onChange={(e) => updateLite('stealth_mode', e.target.checked)}
                        className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Browser Timeout (seconds)</label>
                    <input
                        type="number"
                        value={browserTimeout}
                        onChange={(e) => updateLite('browser_timeout', parseInt(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>
            </div>
        </div>
    );
}
