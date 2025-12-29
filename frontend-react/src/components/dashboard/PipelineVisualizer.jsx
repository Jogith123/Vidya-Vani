import React, { useEffect, useState } from 'react';
import { Mic, FileText, Database, Cpu, Speaker, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const stages = [
    { id: 'recording', label: 'Recording', icon: Mic, color: 'text-red-500' },
    { id: 'stt', label: 'Speech to Text', icon: FileText, color: 'text-blue-500' },
    { id: 'rag', label: 'RAG Retrieval', icon: Database, color: 'text-purple-500' },
    { id: 'llm', label: 'AI Processing', icon: Cpu, color: 'text-amber-500' },
    { id: 'tts', label: 'Text to Speech', icon: Speaker, color: 'text-green-500' },
    { id: 'delivery', label: 'Delivery', icon: Send, color: 'text-teal-500' },
];

import { useWebSocket } from '../../context/WebSocketContext';

const PipelineVisualizer = () => {
    const { pipelineState } = useWebSocket();
    const [activeStage, setActiveStage] = useState(null);

    useEffect(() => {
        if (pipelineState?.activeStage) {
            setActiveStage(pipelineState.activeStage);
        }
    }, [pipelineState]);

    return (
        <div className="glass p-6 rounded-2xl mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Live Processing Pipeline
                </h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    ID: #8472-A
                </span>
            </div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full" />

                {/* Active Progress Line */}
                <motion.div
                    className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: activeStage ? `${((stages.findIndex(s => s.id === activeStage) + 1) / stages.length) * 100}%` : '0%' }}
                    transition={{ duration: 0.5 }}
                />

                <div className="flex justify-between relative z-10">
                    {stages.map((stage, index) => {
                        const isActive = activeStage === stage.id;
                        const isPast = activeStage && stages.findIndex(s => s.id === activeStage) > index;
                        const isFuture = !isActive && !isPast;

                        return (
                            <div key={stage.id} className="flex flex-col items-center gap-3">
                                <motion.div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-300 bg-white dark:bg-surface-dark ${isActive || isPast
                                        ? 'border-primary shadow-lg shadow-primary/20'
                                        : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        borderColor: isActive ? '#1a237e' : isPast ? '#4caf50' : '#e2e8f0'
                                    }}
                                >
                                    <stage.icon
                                        size={20}
                                        className={isActive || isPast ? stage.color : 'text-slate-300 dark:text-slate-600'}
                                    />
                                </motion.div>
                                <span className={`text-xs font-medium ${isActive ? 'text-primary font-bold' : 'text-slate-500'}`}>
                                    {stage.label}
                                </span>

                                {/* Status Pill */}
                                <div className={`h-1.5 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mt-1`}>
                                    {isActive && (
                                        <motion.div
                                            className="h-full bg-secondary"
                                            layoutId="pipeline-active"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '0%' }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        />
                                    )}
                                    {isPast && (
                                        <div className="h-full bg-success w-full" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PipelineVisualizer;
