import React, { useState, useRef } from 'react';
import { parseNginxConfig } from '@/lib/nginx/parser';
import { useConfigStore } from '@/stores/configStore';
import { Upload, AlertTriangle, CheckCircle, FileText, X } from 'lucide-react';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
    const [rawConfig, setRawConfig] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const setConfig = useConfigStore(state => state.setConfig);

    if (!isOpen) return null;

    const handleParse = () => {
        setError(null);
        setWarnings([]);
        setSuccess(false);

        if (!rawConfig.trim()) {
            setError('Please enter or upload a valid Nginx configuration.');
            return;
        }

        try {
            const result = parseNginxConfig(rawConfig);

            if (result.parseErrors.length > 0) {
                setError(`Parse errors: ${result.parseErrors.join(', ')}`);
                return;
            }

            if (result.warnings.length > 0) {
                setWarnings(result.warnings);
            }

            // Update store
            setConfig(result.config);
            setSuccess(true);

            // Auto close after success if no warnings, otherwise let user review
            if (result.warnings.length === 0) {
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setRawConfig('');
                }, 1000);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unexpected error occurred during parsing.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setRawConfig(text);
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-dark-700">
                <div className="flex items-center justify-between p-4 border-b border-dark-700">
                    <h2 className="text-lg font-semibold text-dark-300 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import Nginx Config
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-dark-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-dark-500 hover:text-dark-300" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-4">
                        <p className="text-sm text-dark-400 mb-4">
                            Paste your existing <code>nginx.conf</code> content below or upload a file.
                            We&apos;ll do our best to map it to the generator settings.
                        </p>

                        <div className="relative">
                            <textarea
                                value={rawConfig}
                                onChange={(e) => setRawConfig(e.target.value)}
                                className="w-full h-64 p-4 font-mono text-sm bg-surface-raised text-dark-300 border border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:outline-none resize-none placeholder-dark-500"
                                placeholder="server { ... }"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-4 right-4 bg-surface border border-dark-600 shadow-sm px-3 py-1.5 rounded-md text-xs font-medium text-dark-300 flex items-center gap-2 hover:bg-dark-800 transition-colors"
                            >
                                <FileText className="w-3 h-3" />
                                Upload File
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".conf,text/plain"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-err-500/10 border border-err-500/20 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-err-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-err-400">
                                <span className="font-semibold block mb-1">Import Failed</span>
                                {error}
                            </div>
                        </div>
                    )}

                    {warnings.length > 0 && (
                        <div className="mb-4 p-4 bg-warn-500/10 border border-warn-500/20 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-warn-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-warn-500">
                                <span className="font-semibold block mb-1">Warnings</span>
                                <ul className="list-disc pl-4 space-y-1">
                                    {warnings.map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <div className="text-sm text-emerald-500">
                                Configuration imported successfully!
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-dark-700 flex justify-end gap-3 bg-surface-raised/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-dark-400 hover:text-dark-300 hover:bg-dark-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleParse}
                        disabled={!rawConfig.trim()}
                        className="px-4 py-2 text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                    >
                        Parse & Import
                    </button>
                </div>
            </div>
        </div>
    );
}
