import React, { useState } from 'react';
import { SettingsLayout } from './settings/SettingsLayout';
import { ModelIntelligenceSettings } from './settings/ModelIntelligenceSettings';
import BioDockifyLiteSettings from './settings/BioDockifyLiteSettings';
import BioDockifyResearchSettings from './settings/BioDockifyResearchSettings';
import { SystemSettings } from './settings/SystemSettings';
import { useSettings } from '../hooks/useSettings';
import { Settings } from '../lib/api';

export default function SettingsPanel() {
    const [activeTab, setActiveTab] = useState('models');
    const { settings, loading, updateSettings, resetSettings } = useSettings();

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center">
                <div className="text-slate-400">Loading settings...</div>
            </div>
        );
    }

    const handleReset = async () => {
        if (window.confirm("Are you sure you want to reset all settings to defaults?")) {
            await resetSettings();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col h-screen w-screen overflow-hidden">
            <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab}>
                {activeTab === 'models' && (
                    <ModelIntelligenceSettings
                        settings={(settings || {}) as Settings}
                        onUpdate={(newSettings) => {
                            if (newSettings.ai_provider) {
                                updateSettings('ai_provider', newSettings.ai_provider);
                            }
                        }}
                    />
                )}
                {activeTab === 'lite' && <BioDockifyLiteSettings />}
                {activeTab === 'research' && <BioDockifyResearchSettings />}
                {activeTab === 'system' && (
                    <SystemSettings
                        settings={(settings || {}) as Settings}
                        onSettingChange={updateSettings}
                        onReset={handleReset}
                    />
                )}
                {/* {activeTab === 'diagnostics' && <DiagnosticsPanel />} */}
            </SettingsLayout>
        </div>
    );
}
