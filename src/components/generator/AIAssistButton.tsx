'use client';

import { Sparkles } from 'lucide-react';

/**
 * AI Assist button — integration hook for Pro features.
 *
 * In the open-source repo this renders a disabled "Pro" badge button.
 * When NEXT_PUBLIC_PRO_ENABLED=true and the Pro backend is connected,
 * it activates and calls the /api/ai/generate endpoint.
 */
export default function AIAssistButton() {
    const proEnabled = process.env.NEXT_PUBLIC_PRO_ENABLED === 'true';

    if (!proEnabled) {
        return (
            <button
                disabled
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
          bg-white/5 border border-white/10 text-white/40
          cursor-not-allowed text-sm font-medium"
                title="Available in Pro version"
            >
                <Sparkles className="w-4 h-4" />
                AI Assist — Pro
            </button>
        );
    }

    const handleAIGenerate = async () => {
        // Pro backend handles this — see nginx-config-pro repo
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: '' }), // TODO: wire up prompt input
            });
            if (!res.ok) throw new Error('AI generation failed');
            const data = await res.json();
            console.log('AI config:', data);
        } catch (err) {
            console.error('AI Assist error:', err);
        }
    };

    return (
        <button
            onClick={handleAIGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
        bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600
        hover:to-pink-600 text-white text-sm font-medium
        transition-all duration-200 shadow-lg shadow-purple-500/25"
        >
            <Sparkles className="w-4 h-4" />
            AI Assist
        </button>
    );
}
