'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Collapsible from '@/components/ui/Collapsible';
import { Shield, Plus, Trash2 } from 'lucide-react';

export default function Security() {
    const security = useConfigStore((s) => s.config.security);
    const updateSecurity = useConfigStore((s) => s.updateSecurity);

    const addIp = (list: 'ipAllowlist' | 'ipDenylist') => {
        updateSecurity({ [list]: [...security[list], ''] });
    };
    const removeIp = (list: 'ipAllowlist' | 'ipDenylist', index: number) => {
        updateSecurity({ [list]: security[list].filter((_, i) => i !== index) });
    };
    const updateIp = (list: 'ipAllowlist' | 'ipDenylist', index: number, value: string) => {
        const items = [...security[list]];
        items[index] = value;
        updateSecurity({ [list]: items });
    };

    return (
        <Collapsible title="Security" icon={<Shield className="w-4 h-4" />}>
            <Toggle
                label="Rate Limiting"
                enabled={security.rateLimiting}
                onChange={(v) => updateSecurity({ rateLimiting: v })}
                id="sec-ratelimit"
            />
            {security.rateLimiting && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
                    <Input
                        label="Requests/sec"
                        value={security.rateLimit}
                        type="number"
                        onChange={(v) => updateSecurity({ rateLimit: parseInt(v) || 10 })}
                        id="sec-rate"
                    />
                    <Input
                        label="Burst"
                        value={security.rateBurst}
                        type="number"
                        onChange={(v) => updateSecurity({ rateBurst: parseInt(v) || 20 })}
                        id="sec-burst"
                    />
                </div>
            )}

            <Toggle
                label="Security Headers"
                description="X-Frame-Options, X-Content-Type-Options, Referrer-Policy"
                enabled={security.securityHeaders}
                onChange={(v) => updateSecurity({ securityHeaders: v })}
                id="sec-headers"
            />

            <Toggle
                label="Hide Nginx Version"
                description="server_tokens off"
                enabled={security.hideVersion}
                onChange={(v) => updateSecurity({ hideVersion: v })}
                id="sec-version"
            />

            {/* IP Lists */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-300">IP Allowlist</span>
                    <button onClick={() => addIp('ipAllowlist')} className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300">
                        <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                </div>
                {security.ipAllowlist.map((ip, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={ip}
                            onChange={(e) => updateIp('ipAllowlist', i, e.target.value)}
                            placeholder="192.168.1.0/24"
                            className="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-1.5 text-sm text-dark-300 placeholder-dark-500"
                        />
                        <button onClick={() => removeIp('ipAllowlist', i)} className="p-1.5 text-dark-500 hover:text-err-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-300">IP Denylist</span>
                    <button onClick={() => addIp('ipDenylist')} className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300">
                        <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                </div>
                {security.ipDenylist.map((ip, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={ip}
                            onChange={(e) => updateIp('ipDenylist', i, e.target.value)}
                            placeholder="10.0.0.0/8"
                            className="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-1.5 text-sm text-dark-300 placeholder-dark-500"
                        />
                        <button onClick={() => removeIp('ipDenylist', i)} className="p-1.5 text-dark-500 hover:text-err-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>

            <Toggle
                label="Basic Auth"
                enabled={security.basicAuth}
                onChange={(v) => updateSecurity({ basicAuth: v })}
                id="sec-basicauth"
            />
            {security.basicAuth && (
                <div className="space-y-3 animate-fade-in-up">
                    <Input label="Realm" value={security.basicAuthRealm} onChange={(v) => updateSecurity({ basicAuthRealm: v })} placeholder="Restricted" />
                    <Input label="Password File" value={security.basicAuthFile} onChange={(v) => updateSecurity({ basicAuthFile: v })} placeholder="/etc/nginx/.htpasswd" />
                </div>
            )}
        </Collapsible>
    );
}
