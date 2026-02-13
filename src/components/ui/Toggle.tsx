'use client';

interface ToggleProps {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
    description?: string;
    id?: string;
}

export default function Toggle({ enabled, onChange, label, description, id }: ToggleProps) {
    return (
        <div className="flex items-center justify-between gap-3 py-1.5">
            <div className="flex-1 min-w-0">
                <label htmlFor={id} className="text-sm font-medium text-dark-300 cursor-pointer block">
                    {label}
                </label>
                {description && (
                    <p className="text-xs text-dark-500 mt-0.5">{description}</p>
                )}
            </div>
            <button
                id={id}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                onClick={() => onChange(!enabled)}
                className={`toggle-track flex-shrink-0 ${enabled ? 'active' : ''}`}
            >
                <span className="toggle-thumb" />
            </button>
        </div>
    );
}
