'use client';

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    id?: string;
    className?: string;
}

export default function Select({ label, value, onChange, options, id, className = '' }: SelectProps) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium text-dark-300">
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-300 transition-colors hover:border-dark-600 focus:border-accent-500 appearance-none cursor-pointer"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
