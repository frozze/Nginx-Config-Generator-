'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Select from '@/components/ui/Select';
import Collapsible from '@/components/ui/Collapsible';
import { MapPin, Plus, Trash2, ChevronDown } from 'lucide-react';
import type { LocationConfig, LocationType } from '@/lib/nginx/types';
import { useState } from 'react';

function LocationBlock({ loc }: { loc: LocationConfig }) {
    const [open, setOpen] = useState(true);
    const updateLocation = useConfigStore((s) => s.updateLocation);
    const removeLocation = useConfigStore((s) => s.removeLocation);

    return (
        <div className="border border-dark-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-raised">
                <button onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-2 text-left">
                    <ChevronDown className={`w-4 h-4 text-dark-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                    <code className="text-sm text-accent-400 font-mono">{loc.path || '/'}</code>
                    <span className="text-[10px] uppercase tracking-wider text-dark-500 bg-dark-800 px-1.5 py-0.5 rounded">
                        {loc.type}
                    </span>
                </button>
                <button
                    onClick={() => removeLocation(loc.id)}
                    className="p-1 rounded text-dark-500 hover:text-err-400 transition-colors"
                    aria-label="Delete location"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {open && (
                <div className="p-3 space-y-3 animate-fade-in-up">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Path"
                            value={loc.path}
                            onChange={(v) => updateLocation(loc.id, { path: v })}
                            placeholder="/"
                            id={`loc-path-${loc.id}`}
                        />
                        <Select
                            label="Type"
                            value={loc.type}
                            onChange={(v) => updateLocation(loc.id, { type: v as LocationType })}
                            options={[
                                { value: 'static', label: 'Static Files' },
                                { value: 'proxy', label: 'Reverse Proxy' },
                                { value: 'redirect', label: 'Redirect' },
                                { value: 'custom', label: 'Custom' },
                            ]}
                            id={`loc-type-${loc.id}`}
                        />
                    </div>

                    {loc.type === 'static' && (
                        <div className="space-y-3">
                            <Input label="Root" value={loc.root} onChange={(v) => updateLocation(loc.id, { root: v })} placeholder="/var/www/html" />
                            <Input label="try_files" value={loc.tryFiles} onChange={(v) => updateLocation(loc.id, { tryFiles: v })} placeholder="$uri $uri/ =404" />
                            <Input label="Index" value={loc.index} onChange={(v) => updateLocation(loc.id, { index: v })} placeholder="index.html" />
                            <Toggle label="Autoindex" enabled={loc.autoindex} onChange={(v) => updateLocation(loc.id, { autoindex: v })} />
                            <Input label="Cache Expiry" value={loc.cacheExpiry} onChange={(v) => updateLocation(loc.id, { cacheExpiry: v })} placeholder="30d" />
                        </div>
                    )}

                    {loc.type === 'proxy' && (
                        <div className="space-y-3">
                            <Input label="proxy_pass URL" value={loc.proxyPass} onChange={(v) => updateLocation(loc.id, { proxyPass: v })} placeholder="http://127.0.0.1:3000" />
                            <Toggle label="WebSocket Support" enabled={loc.proxyWebSocket} onChange={(v) => updateLocation(loc.id, { proxyWebSocket: v })} />
                        </div>
                    )}

                    {loc.type === 'redirect' && (
                        <div className="space-y-3">
                            <Input label="Redirect URL" value={loc.redirectUrl} onChange={(v) => updateLocation(loc.id, { redirectUrl: v })} placeholder="https://new-domain.com" />
                            <Select
                                label="Redirect Code"
                                value={String(loc.redirectCode)}
                                onChange={(v) => updateLocation(loc.id, { redirectCode: parseInt(v) as 301 | 302 })}
                                options={[
                                    { value: '301', label: '301 — Permanent' },
                                    { value: '302', label: '302 — Temporary' },
                                ]}
                            />
                        </div>
                    )}

                    {loc.type === 'custom' && (
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-dark-300">Custom Directives</label>
                            <textarea
                                value={loc.customDirectives}
                                onChange={(e) => updateLocation(loc.id, { customDirectives: e.target.value })}
                                rows={5}
                                placeholder="# Enter raw nginx directives here..."
                                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-300 placeholder-dark-500 font-mono resize-y"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Locations() {
    const locations = useConfigStore((s) => s.config.locations);
    const addLocation = useConfigStore((s) => s.addLocation);

    return (
        <Collapsible
            title="Locations"
            icon={<MapPin className="w-4 h-4" />}
            badge={locations.length > 0 ? String(locations.length) : undefined}
        >
            <div className="space-y-3">
                {locations.map((loc) => (
                    <LocationBlock key={loc.id} loc={loc} />
                ))}
                <button
                    onClick={addLocation}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-dark-600 text-sm text-dark-400 hover:border-accent-500 hover:text-accent-400 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Location
                </button>
            </div>
        </Collapsible>
    );
}
