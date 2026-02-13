'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Select from '@/components/ui/Select';
import Collapsible from '@/components/ui/Collapsible';
import { FileText } from 'lucide-react';

export default function Logging() {
    const logging = useConfigStore((s) => s.config.logging);
    const updateLogging = useConfigStore((s) => s.updateLogging);

    return (
        <Collapsible title="Logging" icon={<FileText className="w-4 h-4" />}>
            <Toggle
                label="Access Log"
                enabled={logging.accessLog}
                onChange={(v) => updateLogging({ accessLog: v })}
                id="log-access"
            />
            {logging.accessLog && (
                <Input
                    label="Access Log Path"
                    value={logging.accessLogPath}
                    onChange={(v) => updateLogging({ accessLogPath: v })}
                    placeholder="/var/log/nginx/access.log"
                    id="log-access-path"
                    className="animate-fade-in-up"
                />
            )}

            <Toggle
                label="Error Log"
                enabled={logging.errorLog}
                onChange={(v) => updateLogging({ errorLog: v })}
                id="log-error"
            />
            {logging.errorLog && (
                <div className="space-y-3 animate-fade-in-up">
                    <Input
                        label="Error Log Path"
                        value={logging.errorLogPath}
                        onChange={(v) => updateLogging({ errorLogPath: v })}
                        placeholder="/var/log/nginx/error.log"
                        id="log-error-path"
                    />
                    <Select
                        label="Error Log Level"
                        value={logging.errorLogLevel}
                        onChange={(v) => updateLogging({ errorLogLevel: v as 'warn' | 'error' | 'crit' })}
                        options={[
                            { value: 'warn', label: 'Warning' },
                            { value: 'error', label: 'Error' },
                            { value: 'crit', label: 'Critical' },
                        ]}
                        id="log-error-level"
                    />
                </div>
            )}

            <Toggle
                label="Custom Log Format"
                enabled={logging.customLogFormat}
                onChange={(v) => updateLogging({ customLogFormat: v })}
                id="log-custom"
            />
        </Collapsible>
    );
}
