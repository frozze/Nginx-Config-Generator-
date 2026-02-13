'use client';
import { useConfigStore } from '@/stores/configStore';
import { presets } from '@/lib/nginx/presets';
import type { NginxConfig } from '@/lib/nginx/types';
import { createDefaultConfig } from '@/stores/configStore';
import { Sparkles } from 'lucide-react';

export default function PresetSelector() {
    const setConfig = useConfigStore((s) => s.setConfig);

    const applyPreset = (presetConfig: Partial<NginxConfig>) => {
        const base = createDefaultConfig();
        const merged = { ...base, ...presetConfig };
        // Deep merge nested objects
        if (presetConfig.ssl) merged.ssl = { ...base.ssl, ...presetConfig.ssl };
        if (presetConfig.reverseProxy) merged.reverseProxy = { ...base.reverseProxy, ...presetConfig.reverseProxy };
        if (presetConfig.security) merged.security = { ...base.security, ...presetConfig.security };
        if (presetConfig.performance) merged.performance = { ...base.performance, ...presetConfig.performance };
        if (presetConfig.logging) merged.logging = { ...base.logging, ...presetConfig.logging };
        if (presetConfig.upstream) merged.upstream = { ...base.upstream, ...presetConfig.upstream };
        if (presetConfig.locations) merged.locations = presetConfig.locations;
        setConfig(merged);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-400" />
                <h3 className="text-sm font-semibold text-dark-300">Quick Presets</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.config)}
                        className="group text-left p-3 rounded-xl border border-dark-700 bg-surface-raised hover:border-accent-500/50 hover:bg-accent-500/5 transition-all"
                    >
                        <div className="text-sm font-medium text-dark-300 group-hover:text-accent-400 transition-colors">
                            {preset.name}
                        </div>
                        <div className="text-xs text-dark-500 mt-0.5">{preset.description}</div>
                    </button>
                ))}
            </div>

            {/* AI Assist placeholder */}
            <div className="relative">
                <button
                    disabled
                    className="w-full p-3 rounded-xl border border-dark-700 bg-surface-raised opacity-60 cursor-not-allowed text-left"
                    title="Coming Soon"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-dark-400">🤖 AI Assist</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full">
                            Coming Soon
                        </span>
                    </div>
                    <div className="text-xs text-dark-500 mt-0.5">Describe your setup in plain English</div>
                </button>
            </div>
        </div>
    );
}
