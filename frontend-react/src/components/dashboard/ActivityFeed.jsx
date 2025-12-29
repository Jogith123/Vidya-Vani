import React from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../../context/WebSocketContext';

const ActivityFeed = () => {
    const { logs } = useWebSocket();

    // Filter out verbose low-level system logs
    const activities = logs
        .filter(log => !log.message.includes('metrics') && !log.message.includes('Stage Update'))
        .slice(0, 5);

    return (
        <div className="glass p-6 rounded-2xl h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {activities.length === 0 && (
                    <div className="text-slate-400 text-sm italic">No recent activity</div>
                )}
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-6 pb-2 border-l border-slate-200 dark:border-slate-700 last:border-0 last:pb-0"
                    >
                        <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-surface-dark ${activity.type === 'error' ? 'bg-red-500' :
                            activity.type === 'success' ? 'bg-green-500' :
                                'bg-primary'
                            }`}></div>

                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-1 break-words">
                            {activity.message}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={12} />
                            {activity.timestamp}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
