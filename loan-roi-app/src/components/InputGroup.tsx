import React from 'react';

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
    className = "mb-3"
}) => {
    return (
        <div className={className}>
            <label className="form-label d-flex justify-between">
                <span>{label}</span>
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
