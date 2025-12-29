import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroMetricsGrid from '../components/dashboard/HeroMetricsGrid';
import PipelineVisualizer from '../components/dashboard/PipelineVisualizer';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ChartsSection from '../components/dashboard/ChartsSection';
import { Download } from 'lucide-react';

import { useWebSocket } from '../context/WebSocketContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
    const navigate = useNavigate();
    const { metrics, logs } = useWebSocket();

    const handleExport = () => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Title
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text("Vidya Vani - System Report", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(`Generated: ${timestamp}`, 14, 28);
        doc.text('Confidential - Internal Use Only', 14, 33);

        // Metrics Section
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("System Metrics", 14, 45);

        const metricsData = [
            ["Total Calls Today", metrics.totalCalls || "0"],
            ["Active Sessions", metrics.activeSessions || "0"],
            ["Avg Response Time", `${metrics.avgLatency || 0} ms`],
            ["STT Speed (Speech-to-Text)", `${metrics.sttTime || 0} ms`],
            ["LLM Speed (AI Inference)", `${metrics.llmTime || 0} ms`],
            ["TTS Speed (Text-to-Speech)", `${metrics.ttsTime || 0} ms`]
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: metricsData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
        });

        // Logs Section
        const finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("Recent Activity Log", 14, finalY + 15);

        const logsData = logs.map(log => [
            log.timestamp,
            log.type ? log.type.toUpperCase() : 'INFO',
            log.source || 'System',
            log.message || ''
        ]);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Time', 'Type', 'Source', 'Details']],
            body: logsData,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] }, // Slate 600
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { width: 25 }, 1: { width: 20 }, 2: { width: 25 } }
        });

        doc.save(`vidyavani_report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
