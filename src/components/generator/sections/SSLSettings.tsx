'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Select from '@/components/ui/Select';
import Collapsible from '@/components/ui/Collapsible';
import { Lock } from 'lucide-react';

const PROTOCOL_OPTIONS = ['TLSv1.2', 'TLSv1.3'];

export default function SSLSettings() {
    const ssl = useConfigStore((s) => s.config.ssl);
    const updateSSL = useConfigStore((s) => s.updateSSL);

    const toggleProtocol = (proto: string) => {
        const protocols = ssl.protocols.includes(proto)
            ? ssl.protocols.filter((p) => p !== proto)
            : [...ssl.protocols, proto];
        updateSSL({ protocols });
    };

    return (
        <Collapsible title="HTTPS / SSL" icon={<Lock className="w-4 h-4" />} badge={ssl.enabled ? 'ON' : undefined}>
            <Toggle
                label="Enable SSL"
                enabled={ssl.enabled}
                onChange={(v) => updateSSL({ enabled: v })}
                id="ssl-enable"
            />

            {ssl.enabled && (
                <div className="space-y-4 animate-fade-in-up">
                    <Input
                        label="SSL Certificate Path"
                        value={ssl.certificatePath}
                        onChange={(v) => updateSSL({ certificatePath: v })}
                        placeholder="/etc/letsencrypt/live/example.com/fullchain.pem"
                        id="ssl-cert"
                    />
                    <Input
                        label="SSL Key Path"
                        value={ssl.keyPath}
                        onChange={(v) => updateSSL({ keyPath: v })}
                        placeholder="/etc/letsencrypt/live/example.com/privkey.pem"
                        id="ssl-key"
                    />

                    <Toggle
                        label="HTTP → HTTPS Redirect"
                        description="Creates a separate server block on port 80 that redirects to HTTPS"
                        enabled={ssl.httpRedirect}
                        onChange={(v) => updateSSL({ httpRedirect: v })}
                        id="ssl-redirect"
                    />

                    <div className="space-y-1.5">
                        <span className="block text-sm font-medium text-dark-300">SSL Protocols</span>
                        <div className="flex gap-3">
                            {PROTOCOL_OPTIONS.map((proto) => (
                                <label key={proto} className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={ssl.protocols.includes(proto)}
                                        onChange={() => toggleProtocol(proto)}
                                        className="rounded border-dark-600 bg-dark-800 text-accent-500 focus:ring-accent-500"
                                    />
                                    {proto}
                                </label>
                            ))}
                        </div>
                    </div>

                    <Toggle
                        label="Enable HSTS"
                        description="Strict Transport Security header"
                        enabled={ssl.enableHSTS}
                        onChange={(v) => updateSSL({ enableHSTS: v })}
                        id="ssl-hsts"
                    />
                    <Toggle
                        label="Enable OCSP Stapling"
                        enabled={ssl.enableOCSP}
                        onChange={(v) => updateSSL({ enableOCSP: v })}
                        id="ssl-ocsp"
                    />

                    <Select
                        label="SSL Preset"
                        value={ssl.preset}
                        onChange={(v) => updateSSL({ preset: v as 'modern' | 'intermediate' | 'legacy' })}
                        options={[
                            { value: 'modern', label: 'Modern (TLS 1.3 only)' },
                            { value: 'intermediate', label: 'Intermediate (TLS 1.2+)' },
                            { value: 'legacy', label: 'Legacy' },
                        ]}
                        id="ssl-preset"
                    />
                </div>
            )}
        </Collapsible>
    );
}
