import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroMetricsGrid from '../components/dashboard/HeroMetricsGrid';
import PipelineVisualizer from '../components/dashboard/PipelineVisualizer';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ChartsSection from '../components/dashboard/ChartsSection';
import { Download } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleExport = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        alert(`Generating system report for ${timestamp}...\n(Download simulation started)`);
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">System Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400">Real-time metrics and performance analytics</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export Report
                    </button>
                    <button
                        onClick={() => navigate('/calls')}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors"
                    >
                        Live View
                    </button>
                </div>
            </div>

            <HeroMetricsGrid />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2">
                    <PipelineVisualizer />
                    <ChartsSection />
                </div>
                <div className="xl:col-span-1">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
