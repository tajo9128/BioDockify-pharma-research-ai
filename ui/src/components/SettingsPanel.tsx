import React, { useState } from 'react';
import { SettingsLayout } from './settings/SettingsLayout';
import ModelIntelligenceSettings from './settings/ModelIntelligenceSettings';
import BioDockifyLiteSettings from './settings/BioDockifyLiteSettings';
import BioDockifyResearchSettings from './settings/BioDockifyResearchSettings';
import { SystemSettings } from './settings/SystemSettings';
// import DiagnosticsPanel from './DiagnosticsPanel'; // TODO: Implement Diagnostics

export default function SettingsPanel() {
    const [activeTab, setActiveTab] = useState('models');

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col h-screen w-screen overflow-hidden">
            <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab}>
                {activeTab === 'models' && <ModelIntelligenceSettings />}
                {activeTab === 'lite' && <BioDockifyLiteSettings />}
                {activeTab === 'research' && <BioDockifyResearchSettings />}
                {activeTab === 'system' && <SystemSettings />}
                {/* {activeTab === 'diagnostics' && <DiagnosticsPanel />} */}
            </SettingsLayout>
        </div>
    );
}
