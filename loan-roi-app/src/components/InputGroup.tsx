import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InputGroupProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    type?: 'number' | 'range';
    min?: number;
    max?: number;
    step?: number;
    prefix?: string;
    suffix?: string;
    helperText?: string;
    tooltip?: string;
    className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({
    label,
    value,
    onChange,
    type = 'number',
    min,
    max,
    step,
    prefix,
    suffix,
    helperText,
    tooltip,
    className = "mb-3"
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className={className}>
            <label className="form-label d-flex justify-between items-center">
                <span className="flex items-center gap-2">
                    {label}
                    {tooltip && (
                        <div className="relative inline-block">
                            <button
                                type="button"
                                className="tooltip-trigger"
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowTooltip(!showTooltip);
                                }}
                                aria-label="Help"
                            >
                                <HelpCircle size={16} />
                            </button>
                            {showTooltip && (
                                <div className="tooltip-popup">
                                    {tooltip}
                                    <div className="tooltip-arrow"></div>
                                </div>
                            )}
                        </div>
                    )}
                </span>
                {type === 'range' && (
                    <span className="text-primary font-bold">
                        {prefix}{value}{suffix}
                    </span>
                )}
            </label>

            {type === 'number' ? (
                <div className="relative" style={{ position: 'relative' }}>
                    {prefix && (
                        <span style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }}>
                            {prefix}
                        </span>
                    )}
                    <input
                        type="number"
                        className="form-control"
                        style={{
                            paddingLeft: prefix ? '2rem' : undefined,
                            paddingRight: suffix ? '2rem' : undefined
                        }}
                        value={value}
                        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                        step={step}
                    />
                    {suffix && (
                        <span style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }}>
                            {suffix}
                        </span>
                    )}
                </div>
            ) : (
                <input
                    type="range"
                    className="form-range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                />
            )}

            {helperText && <small className="text-muted block mt-1">{helperText}</small>}
        </div>
    );
};
