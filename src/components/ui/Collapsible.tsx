'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleProps {
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
    badge?: string;
}

export default function Collapsible({ title, icon, defaultOpen = false, children, badge }: CollapsibleProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border border-dark-700 rounded-xl overflow-hidden transition-colors hover:border-dark-600">
            <button
                onClick={() => setOpen(!open)}
                className="collapsible-header w-full flex items-center gap-3 px-4 py-3.5 bg-surface-raised hover:bg-surface-overlay transition-colors"
                aria-expanded={open}
            >
                {icon && <span className="text-accent-400 flex-shrink-0">{icon}</span>}
                <span className="text-sm font-semibold text-dark-300 flex-1 text-left">{title}</span>
                {badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-500/15 text-accent-400 px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
                <ChevronDown
                    className={`w-4 h-4 text-dark-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div className="px-4 py-4 bg-surface space-y-4 animate-fade-in-up">
                    {children}
                </div>
            )}
        </div>
    );
}
