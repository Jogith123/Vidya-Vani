import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Clock, ThumbsUp, Calendar } from 'lucide-react';

const Analytics = () => {
    // Mock Data - To be replaced by API calls in future (incl. MongoDB for subjects)
    const callVolumeData = [
        { day: 'Mon', calls: 65, missed: 4 },
        { day: 'Tue', calls: 89, missed: 6 },
        { day: 'Wed', calls: 142, missed: 2 },
        { day: 'Thu', calls: 110, missed: 5 },
        { day: 'Fri', calls: 95, missed: 3 },
        { day: 'Sat', calls: 45, missed: 1 },
        { day: 'Sun', calls: 30, missed: 0 },
    ];

    const subjectData = [
        { name: 'Physics', value: 400 },
        { name: 'History', value: 300 },
        { name: 'Mathematics', value: 300 },
        { name: 'Biology', value: 200 },
    ];

    const performanceData = [
        { time: '09:00', latency: 320 },
        { time: '10:00', latency: 450 },
        { time: '11:00', latency: 380 },
        { time: '12:00', latency: 290 },
        { time: '13:00', latency: 310 },
        { time: '14:00', latency: 550 },
        { time: '15:00', latency: 400 },
        { time: '16:00', latency: 350 },
    ];

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6'];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
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
            className="space-y-6"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">System performance and usage trends</p>
            </motion.div>

            {/* Top Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Calls (Week)" value="1,245" trend="+12%" icon={TrendingUp} color="bg-blue-500" />
                <StatCard title="Unique Students" value="842" trend="+5%" icon={Users} color="bg-purple-500" />
                <StatCard title="Avg Session Time" value="4m 32s" trend="-2%" icon={Clock} color="bg-orange-500" />
                <StatCard title="Satisfaction Score" value="4.8/5" trend="+0.2" icon={ThumbsUp} color="bg-green-500" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Call Volume Trends</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={callVolumeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                <XAxis dataKey="day" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="missed" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Pie Chart - Subjects */}
                <motion.div variants={itemVariants} className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Subject Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={subjectData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {subjectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-2 italic">* Data source: MongoDB (Planned)</p>
                </motion.div>
            </div>

            {/* Bottom Area Chart */}
            <motion.div variants={itemVariants} className="glass p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">System Latency (ms)</h3>
                    <div className="flex gap-2">
                        <button className="p-1 px-3 text-xs bg-primary/10 text-primary rounded-full">Today</button>
                        <button className="p-1 px-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Week</button>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                            <defs>
                                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="latency" stroke="#ec4899" fillOpacity={1} fill="url(#colorLatency)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Helper Component for small stat cards
const StatCard = ({ title, value, trend, icon: Icon, color }) => (
    <div className="glass p-5 rounded-xl flex items-center justify-between">
        <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
            <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {trend} <span className="text-slate-400 ml-1">vs last week</span>
            </span>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
    </div>
);

export default Analytics;
