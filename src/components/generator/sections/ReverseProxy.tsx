'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Collapsible from '@/components/ui/Collapsible';
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react';

export default function ReverseProxy() {
    const proxy = useConfigStore((s) => s.config.reverseProxy);
    const updateReverseProxy = useConfigStore((s) => s.updateReverseProxy);

    const addHeader = () => {
        updateReverseProxy({
            customHeaders: [...proxy.customHeaders, { key: '', value: '' }],
        });
    };

    const removeHeader = (index: number) => {
        updateReverseProxy({
            customHeaders: proxy.customHeaders.filter((_, i) => i !== index),
        });
    };

    const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
        const headers = [...proxy.customHeaders];
        headers[index] = { ...headers[index], [field]: val };
        updateReverseProxy({ customHeaders: headers });
    };

    return (
        <Collapsible title="Reverse Proxy" icon={<ArrowRightLeft className="w-4 h-4" />} badge={proxy.enabled ? 'ON' : undefined}>
            <Toggle
                label="Enable Reverse Proxy"
                enabled={proxy.enabled}
                onChange={(v) => updateReverseProxy({ enabled: v })}
                id="proxy-enable"
            />

            {proxy.enabled && (
                <div className="space-y-4 animate-fade-in-up">
                    <Input
                        label="Backend Address"
                        value={proxy.backendAddress}
                        onChange={(v) => updateReverseProxy({ backendAddress: v })}
                        placeholder="http://127.0.0.1:3000"
                        id="proxy-backend"
                    />

                    <Toggle
                        label="WebSocket Support"
                        description="Adds Upgrade and Connection headers"
                        enabled={proxy.webSocket}
                        onChange={(v) => updateReverseProxy({ webSocket: v })}
                        id="proxy-ws"
                    />

                    <Toggle
                        label="Pass Real IP Headers"
                        description="X-Real-IP, X-Forwarded-For, X-Forwarded-Proto"
                        enabled={proxy.realIpHeaders}
                        onChange={(v) => updateReverseProxy({ realIpHeaders: v })}
                        id="proxy-realip"
                    />

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-dark-300">Custom Proxy Headers</span>
                            <button
                                onClick={addHeader}
                                className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        </div>
                        {proxy.customHeaders.map((header, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    value={header.key}
                                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                                    placeholder="Header-Name"
                                    className="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-1.5 text-sm text-dark-300 placeholder-dark-500"
                                />
                                <input
                                    value={header.value}
                                    onChange={(e) => updateHeader(i, 'value', e.target.value)}
                                    placeholder="Value"
                                    className="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-1.5 text-sm text-dark-300 placeholder-dark-500"
                                />
                                <button
                                    onClick={() => removeHeader(i)}
                                    className="p-1.5 rounded text-dark-500 hover:text-err-400 transition-colors"
                                    aria-label="Remove header"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Collapsible>
    );
}
