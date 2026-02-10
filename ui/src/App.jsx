import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import apiService from './api';
import ResearchDashboard from './components/ResearchDashboard';
import BackendInitializer from './components/BackendInitializer';
import FirstRunWizard from './components/FirstRunWizard';
import { Microscope, ArrowRight, Play } from 'lucide-react';

const LandingPage = () => {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleStart = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const res = await apiService.startResearch(title);
            navigate(`/dashboard/${res.task_id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to start research");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
            <div className="max-w-2xl w-full space-y-8 text-center">

                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-full mb-4">
                        <Microscope size={48} className="text-blue-400" />
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        BioDockify AI
                    </h1>
                    <p className="text-xl text-slate-400">
                        Zero-Cost Pharmaceutical Research Platform
                    </p>
                </div>

                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
                    <form onSubmit={handleStart} className="space-y-4">
                        <div>
                            <label className="block text-left text-sm font-medium text-slate-400 mb-2">
                                Research Topic
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Alzheimer's Drug Repurposing"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Initializing...' : (
                                <>
                                    Start Research <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-sm text-slate-400">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                        <strong className="text-white block mb-1">Literature Analysis</strong>
                        Parses PDFs to extract biomedical entities.
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                        <strong className="text-white block mb-1">Knowledge Graph</strong>
                        Builds connections between Drugs and Diseases.
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                        <strong className="text-white block mb-1">Zero-Cost AI</strong>
                        Runs locally or using free tier models.
                    </div>
                </div>

            </div>
        </div>
    );
};

const App = () => {
    const [showWizard, setShowWizard] = useState(() => {
        return localStorage.getItem('biodockify_first_run_complete') !== 'true';
    });

    const handleWizardComplete = (settings) => {
        console.log('Setup complete with settings:', settings);
        setShowWizard(false);
    };

    return (
        <BackendInitializer>
            {showWizard && <FirstRunWizard onComplete={handleWizardComplete} />}
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/dashboard/:taskId" element={<ResearchDashboard />} />
                </Routes>
            </Router>
        </BackendInitializer>
    );
};

export default App;
