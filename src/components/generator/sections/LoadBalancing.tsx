'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Select from '@/components/ui/Select';
import Collapsible from '@/components/ui/Collapsible';
import { Network, Plus, Trash2 } from 'lucide-react';

export default function LoadBalancing() {
    const upstream = useConfigStore((s) => s.config.upstream);
    const updateUpstream = useConfigStore((s) => s.updateUpstream);
    const addUpstreamServer = useConfigStore((s) => s.addUpstreamServer);
    const removeUpstreamServer = useConfigStore((s) => s.removeUpstreamServer);
    const updateUpstreamServer = useConfigStore((s) => s.updateUpstreamServer);

    return (
        <Collapsible title="Load Balancing" icon={<Network className="w-4 h-4" />} badge={upstream.enabled ? 'ON' : undefined}>
            <Toggle
                label="Enable Upstream Block"
                enabled={upstream.enabled}
                onChange={(v) => updateUpstream({ enabled: v })}
                id="lb-enable"
            />

            {upstream.enabled && (
                <div className="space-y-4 animate-fade-in-up">
                    <Input
                        label="Upstream Name"
                        value={upstream.name}
                        onChange={(v) => updateUpstream({ name: v })}
                        placeholder="backend"
                        id="lb-name"
                    />

                    <Select
                        label="Balancing Method"
                        value={upstream.method}
                        onChange={(v) => updateUpstream({ method: v as 'round-robin' | 'least_conn' | 'ip_hash' | 'random' })}
                        options={[
                            { value: 'round-robin', label: 'Round Robin' },
                            { value: 'least_conn', label: 'Least Connections' },
                            { value: 'ip_hash', label: 'IP Hash' },
                            { value: 'random', label: 'Random' },
                        ]}
                        id="lb-method"
                    />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-dark-300">Backend Servers</span>
                            <button
                                onClick={addUpstreamServer}
                                className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Server
                            </button>
                        </div>

                        {upstream.servers.map((srv) => (
                            <div key={srv.id} className="border border-dark-700 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <code className="text-xs text-accent-400 font-mono">{srv.address || '...'}</code>
                                    <button
                                        onClick={() => removeUpstreamServer(srv.id)}
                                        className="p-1 text-dark-500 hover:text-err-400"
                                        aria-label="Remove server"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <Input
                                    label="Address"
                                    value={srv.address}
                                    onChange={(v) => updateUpstreamServer(srv.id, { address: v })}
                                    placeholder="10.0.0.1:8080"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <Input
                                        label="Weight"
                                        value={srv.weight}
                                        type="number"
                                        onChange={(v) => updateUpstreamServer(srv.id, { weight: parseInt(v) || 1 })}
                                    />
                                    <Input
                                        label="Max Fails"
                                        value={srv.maxFails}
                                        type="number"
                                        onChange={(v) => updateUpstreamServer(srv.id, { maxFails: parseInt(v) || 0 })}
                                    />
                                    <Input
                                        label="Fail Timeout"
                                        value={srv.failTimeout}
                                        type="number"
                                        onChange={(v) => updateUpstreamServer(srv.id, { failTimeout: parseInt(v) || 0 })}
                                    />
                                </div>
                            </div>
                        ))}

                        {upstream.servers.length === 0 && (
                            <p className="text-xs text-dark-500 text-center py-4">No backend servers configured yet.</p>
                        )}
                    </div>
                </div>
            )}
        </Collapsible>
    );
}
