'use client';

interface InputProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: 'text' | 'number';
    placeholder?: string;
    id?: string;
    className?: string;
}

export default function Input({ label, value, onChange, type = 'text', placeholder, id, className = '' }: InputProps) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium text-dark-300">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-300 placeholder-dark-500 transition-colors hover:border-dark-600 focus:border-accent-500"
            />
        </div>
    );
}
