'use client';
import { useConfigStore } from '@/stores/configStore';
import Input from '@/components/ui/Input';
import Collapsible from '@/components/ui/Collapsible';
import { Settings } from 'lucide-react';

const INDEX_OPTIONS = ['index.html', 'index.htm', 'index.php'];

export default function BasicSettings() {
    const config = useConfigStore((s) => s.config);
    const updateBasic = useConfigStore((s) => s.updateBasic);

    const toggleIndex = (file: string) => {
        const files = config.indexFiles.includes(file)
            ? config.indexFiles.filter((f) => f !== file)
            : [...config.indexFiles, file];
        updateBasic({ indexFiles: files });
    };

    return (
        <Collapsible title="Basic Settings" icon={<Settings className="w-4 h-4" />} defaultOpen>
            <Input
                label="Server Name (domain)"
                value={config.serverName}
                onChange={(v) => updateBasic({ serverName: v })}
                placeholder="example.com, www.example.com"
                id="server-name"
            />
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Listen Port"
                    value={config.listenPort}
                    type="number"
                    onChange={(v) => updateBasic({ listenPort: parseInt(v) || 80 })}
                    id="listen-port"
                />
                <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.listen443}
                            onChange={(e) => updateBasic({ listen443: e.target.checked })}
                            className="rounded border-dark-600 bg-dark-800 text-accent-500 focus:ring-accent-500"
                        />
                        Also listen on 443
                    </label>
                </div>
            </div>
            <Input
                label="Root Directory"
                value={config.rootPath}
                onChange={(v) => updateBasic({ rootPath: v })}
                placeholder="/var/www/html"
                id="root-path"
            />
            <div className="space-y-1.5">
                <span className="block text-sm font-medium text-dark-300">Index Files</span>
                <div className="flex flex-wrap gap-3">
                    {INDEX_OPTIONS.map((file) => (
                        <label key={file} className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.indexFiles.includes(file)}
                                onChange={() => toggleIndex(file)}
                                className="rounded border-dark-600 bg-dark-800 text-accent-500 focus:ring-accent-500"
                            />
                            {file}
                        </label>
                    ))}
                </div>
            </div>
        </Collapsible>
    );
}
