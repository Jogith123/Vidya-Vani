import React from 'react';
import { LayoutDashboard, Phone, BarChart3, BookOpen, Settings, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Phone, label: 'Live Calls', path: '/calls' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: BookOpen, label: 'Content Library', path: '/content' },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-700 flex flex-col h-screen fixed left-0 top-0 z-30 transition-colors duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                    V
                </div>
                <div>
                    <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">VidyaVani</h1>
                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">Enterprise</p>
                </div>
            </div>

            <div className="px-6 mb-6">
                <div className="bg-gradient-to-r from-primary/10 to-transparent p-3 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-primary dark:text-primary-light">System Operational</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">v2.4.0-stable</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <item.icon
                                size={20}
                                className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'} transition-colors`}
                            />
                            {item.label}
                            {item.label === 'Live Calls' && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-red-500/50">LIVE</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-500">
                            <Zap size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">Pro Plan</p>
                            <p className="text-[10px] text-slate-500">Valid until Dec 2025</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">75% Usage Limits</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
