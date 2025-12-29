import React from 'react';
import PhoneSimulator from '../components/dashboard/PhoneSimulator';
import Terminal from '../components/dashboard/Terminal';
import { motion } from 'framer-motion';
import { useSystemStatus } from '../hooks/api/useSystemStatus';

const LiveCalls = () => {
    const { data: status } = useSystemStatus();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="mb-8" variants={itemVariants}>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Live Call Center</h1>
                <p className="text-slate-500 dark:text-slate-400">Monitor active sessions and system logs in real-time</p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <motion.div
                    className="flex justify-center xl:justify-end order-1 xl:order-none"
                    variants={itemVariants}
                >
                    {/* Phone Centered or Aligned */}
                    <div className="relative">
                        <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <PhoneSimulator />
                    </div>
                </motion.div>

                <motion.div
                    className="order-2 xl:order-none"
                    variants={itemVariants}
                >
                    <Terminal />

                    <div className="mt-6 glass p-6 rounded-xl">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Connection Status</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${status?.websocket === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-sm text-slate-600 dark:text-slate-300">WebSocket: {status?.websocket || 'Connecting...'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${status?.backend === 'Online' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                <span className="text-sm text-slate-600 dark:text-slate-300">Backend API: {status?.backend || 'Checking...'}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default LiveCalls;
