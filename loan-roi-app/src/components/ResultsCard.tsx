import React from 'react';
import { kFormat } from '../utils/calculations';

interface ResultsCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'default' | 'success' | 'danger' | 'warning';
}

export const ResultsCard: React.FC<ResultsCardProps> = ({
    label,
    value,
    subValue,
    icon,
    color = 'default'
}) => {
    const getColorClass = () => {
        switch (color) {
            case 'success': return 'text-success';
            case 'danger': return 'text-danger';
            case 'warning': return 'text-warning';
            default: return 'text-gradient';
        }
    };

    return (
        <div className="card h-100 text-center">
            <div className="card-body">
                <div className="text-muted text-uppercase text-xs font-bold mb-2 flex justify-center items-center gap-2">
                    {icon} {label}
                </div>
                <div className={`text-3xl font-bold mb-1 ${getColorClass()}`}>
                    {typeof value === 'number' ? kFormat(value) : value}
                </div>
                {subValue && <div className="text-sm text-muted">{subValue}</div>}
            </div>
        </div>
    );
};
