import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine
} from 'recharts';
import type { TimelinePoint } from '../types';
import { kFormat } from '../utils/calculations';

interface ChartsProps {
    data: TimelinePoint[];
    type: 'balance' | 'roi' | 'wealth';
}

export const Charts: React.FC<ChartsProps> = ({ data, type }) => {
    if (type === 'balance') {
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={(val) => Math.floor(val / 12) + 'y'} />
                        <YAxis stroke="#94a3b8" tickFormatter={(val) => kFormat(val)} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                            formatter={(val: number) => kFormat(val)}
                            labelFormatter={(label) => `Month ${label} (Year ${(label / 12).toFixed(1)})`}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="remainingBalance"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                            name="Remaining Balance"
                        />
                        <Area
                            type="monotone"
                            dataKey="paidInterest"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorInterest)"
                            name="Monthly Interest"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (type === 'wealth') {
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={(val) => Math.floor(val / 12) + 'y'} />
                        <YAxis stroke="#94a3b8" tickFormatter={(val) => kFormat(val)} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                            formatter={(val: number) => kFormat(val)}
                            labelFormatter={(label) => `Month ${label} (Year ${(label / 12).toFixed(1)})`}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="equity"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Net Equity (Wealth)"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="totalCashInvestedSoFar"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Total Cash Invested"
                            dot={false}
                        />
                        <ReferenceLine y={0} stroke="#64748b" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={(val) => Math.floor(val / 12) + 'y'} />
                    <YAxis stroke="#94a3b8" tickFormatter={(val) => kFormat(val)} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                        formatter={(val: number) => kFormat(val)}
                        labelFormatter={(label) => `Month ${label} (Year ${(label / 12).toFixed(1)})`}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="cumulativeCashflow"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Cumulative Cashflow"
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
