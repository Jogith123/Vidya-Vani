import React from 'react';
import { Clock } from 'lucide-react';

const ActivityFeed = () => {
    const activities = [
        { id: 1, text: 'Student #8472 asked "What is photosynthesis?"', time: '2s ago', type: 'query' },
        { id: 2, text: 'Answer generated via Physics-RAG-v2', time: '2.8s ago', type: 'system' },
        { id: 3, text: 'Telugu session started', time: '1m ago', type: 'session' },
        { id: 4, text: 'System health check: All APIs 100% uptime', time: '5m ago', type: 'health' },
    ];

    return (
        <div className="glass p-6 rounded-2xl h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={activity.id} className="relative pl-6 pb-2 border-l border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                        <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-surface-dark ${activity.type === 'query' ? 'bg-primary' :
                                activity.type === 'system' ? 'bg-secondary' :
                                    activity.type === 'health' ? 'bg-success' : 'bg-slate-400'
                            }`}></div>

                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-1">
                            {activity.text}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={12} />
                            {activity.time}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
