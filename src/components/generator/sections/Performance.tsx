'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Select from '@/components/ui/Select';
import Collapsible from '@/components/ui/Collapsible';
import { Zap } from 'lucide-react';

const GZIP_TYPES = [
    'text/plain',
    'text/css',
    'application/json',
    'application/javascript',
    'text/xml',
    'application/xml',
    'image/svg+xml',
];

export default function Performance() {
    const perf = useConfigStore((s) => s.config.performance);
    const updatePerformance = useConfigStore((s) => s.updatePerformance);

    const toggleGzipType = (type: string) => {
        const types = perf.gzipTypes.includes(type)
            ? perf.gzipTypes.filter((t) => t !== type)
            : [...perf.gzipTypes, type];
        updatePerformance({ gzipTypes: types });
    };

    return (
        <Collapsible title="Performance" icon={<Zap className="w-4 h-4" />}>
            <Toggle
                label="Gzip Compression"
                enabled={perf.gzip}
                onChange={(v) => updatePerformance({ gzip: v })}
                id="perf-gzip"
            />
            {perf.gzip && (
                <div className="space-y-1.5 animate-fade-in-up">
                    <span className="block text-xs font-medium text-dark-500">MIME Types</span>
                    <div className="flex flex-wrap gap-2">
                        {GZIP_TYPES.map((type) => (
                            <label key={type} className="flex items-center gap-1.5 text-xs text-dark-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={perf.gzipTypes.includes(type)}
                                    onChange={() => toggleGzipType(type)}
                                    className="rounded border-dark-600 bg-dark-800 text-accent-500"
                                />
                                {type}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <Toggle
                label="Brotli Compression"
                enabled={perf.brotli}
                onChange={(v) => updatePerformance({ brotli: v })}
                id="perf-brotli"
            />

            <Toggle
                label="Static File Caching"
                enabled={perf.staticCaching}
                onChange={(v) => updatePerformance({ staticCaching: v })}
                id="perf-caching"
            />
            {perf.staticCaching && (
                <Input
                    label="Cache Expiry"
                    value={perf.cacheExpiry}
                    onChange={(v) => updatePerformance({ cacheExpiry: v })}
                    placeholder="30d"
                    id="perf-cache-expiry"
                    className="animate-fade-in-up"
                />
            )}

            <Toggle
                label="HTTP/2"
                enabled={perf.http2}
                onChange={(v) => updatePerformance({ http2: v })}
                id="perf-http2"
            />

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-dark-300">Max Body Size</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={perf.clientMaxBodySize}
                            onChange={(e) => updatePerformance({ clientMaxBodySize: parseInt(e.target.value) || 1 })}
                            className="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-300"
                        />
                        <select
                            value={perf.clientMaxBodyUnit}
                            onChange={(e) => updatePerformance({ clientMaxBodyUnit: e.target.value as 'MB' | 'GB' })}
                            className="rounded-lg border border-dark-700 bg-dark-800 px-2 py-2 text-sm text-dark-300"
                        >
                            <option value="MB">MB</option>
                            <option value="GB">GB</option>
                        </select>
                    </div>
                </div>
                <Input
                    label="Keepalive Timeout"
                    value={perf.keepaliveTimeout}
                    type="number"
                    onChange={(v) => updatePerformance({ keepaliveTimeout: parseInt(v) || 65 })}
                    id="perf-keepalive"
                />
            </div>

            <Input
                label="Worker Connections"
                value={perf.workerConnections}
                type="number"
                onChange={(v) => updatePerformance({ workerConnections: parseInt(v) || 1024 })}
                id="perf-workers"
            />
        </Collapsible>
    );
}
