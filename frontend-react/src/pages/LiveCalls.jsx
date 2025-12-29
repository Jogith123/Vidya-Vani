import React from 'react';
import PhoneSimulator from '../components/dashboard/PhoneSimulator';
import Terminal from '../components/dashboard/Terminal';

const LiveCalls = () => {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Live Call Center</h1>
                <p className="text-slate-500 dark:text-slate-400">Monitor active sessions and system logs in real-time</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="flex justify-center xl:justify-end order-1 xl:order-none">
                    {/* Phone Centered or Aligned */}
                    <div className="relative">
                        <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <PhoneSimulator />
                    </div>
                </div>

                <div className="order-2 xl:order-none">
                    <Terminal />

                    <div className="mt-6 glass p-6 rounded-xl">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Connection Status</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm text-slate-600 dark:text-slate-300">WebSocket: Connected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                <span className="text-sm text-slate-600 dark:text-slate-300">Backend API: Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveCalls;
