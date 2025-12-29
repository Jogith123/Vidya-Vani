import React from 'react';
import { Phone, Clock, CheckCircle2, Users } from 'lucide-react';
import MetricCard from './MetricCard';

const HeroMetricsGrid = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="Total Calls Today"
                value="1,247"
                trend={12.5}
                icon={Phone}
                color="primary"
            />
            <MetricCard
                title="Avg Response Time"
                value="3.2"
                suffix="s"
                trend={-5.4}
                icon={Clock}
                color="secondary"
            />
            <MetricCard
                title="Answer Accuracy"
                value="94.7"
                suffix="%"
                trend={2.1}
                icon={CheckCircle2}
                color="success"
            />
            <MetricCard
                title="Active Sessions"
                value="23"
                trend={8.4}
                icon={Users}
                color="purple"
            />
        </div>
    );
};

export default HeroMetricsGrid;
