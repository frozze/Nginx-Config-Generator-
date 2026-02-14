'use client';
import { useState, useEffect } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { lintConfig, availableRules, type LintReport, type LintResult } from '@/lib/nginx/linter';
import { parseNginxConfig } from '@/lib/nginx/parser';
import { generateNginxConfig } from '@/lib/nginx/engine/generator';
import { NginxConfig } from '@/lib/nginx/types';
import { AlertTriangle, CheckCircle, Info, Shield, Zap, RefreshCw, Copy, ArrowRight, Download, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function LinterPage() {
    const { config: storeConfig } = useConfigStore();
    const [inputConfig, setInputConfig] = useState('');
    const [report, setReport] = useState<LintReport | null>(null);
    const [parsedConfig, setParsedConfig] = useState<NginxConfig | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);

    // Initial load or when user wants to load from generator
    const loadFromGenerator = () => {
        const generated = generateNginxConfig(storeConfig);
        setInputConfig(generated.config);
    };

    // Run linting whenever input changes
    useEffect(() => {
        if (!inputConfig.trim()) {
            setReport(null);
            setParsedConfig(null);
            return;
        }

        try {
            const result = parseNginxConfig(inputConfig);
            if (result.parseErrors.length > 0) {
                setParseError(result.parseErrors.join('\n'));
                // Try to lint anyway if we got a partial config? 
                // For now, let's just show parser error.
                setParsedConfig(result.config); // result.config might be partial
                const lintReport = lintConfig(result.config);
                setReport(lintReport);
            } else {
                setParseError(null);
                setParsedConfig(result.config);
                const lintReport = lintConfig(result.config);
                setReport(lintReport);
            }
        } catch (err: any) {
            setParseError(err.message || 'Failed to parse configuration');
            setReport(null);
        }
    }, [inputConfig]);

    const applyFix = (result: LintResult) => {
        if (!parsedConfig) return;

        const rule = availableRules.find(r => r.id === result.ruleId);
        if (!rule || !rule.fix) return;

        try {
            const updates = rule.fix(parsedConfig);
            // Deep merge updates into parsedConfig
            // For simplicity, we assume generic object merge is needed, but our fixes are usually specific.
            // We can use a simple spread for top-level, but deep merge for nested is safer.
            // However, our current rules return full nested partials (e.g. { security: { hideVersion: true } })

            // Let's implement a simple deep merge or just use what we have.
            // Since our config structure is known, we can merge carefully.
            const newConfig = deepMerge(parsedConfig, updates);

            setParsedConfig(newConfig);
            const generated = generateNginxConfig(newConfig);
            setInputConfig(generated.config);

            // The useEffect will trigger and re-lint
        } catch (err) {
            console.error('Failed to apply fix:', err);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-dark-300">Nginx Config Linter</h1>
                    <p className="text-dark-400 mt-2">Analyze your configuration for security, performance, and correctness issues.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadFromGenerator}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500/10 text-accent-400 font-medium hover:bg-accent-500/20 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Load from Generator
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-dark-300">Nginx Configuration</label>
                        <span className="text-xs text-dark-500">Paste your nginx.conf here</span>
                    </div>
                    <div className="relative h-[600px] border border-dark-700 rounded-xl overflow-hidden bg-dark-950">
                        <textarea
                            value={inputConfig}
                            onChange={(e) => setInputConfig(e.target.value)}
                            className="w-full h-full p-4 bg-transparent text-sm font-mono text-dark-200 resize-none focus:outline-none"
                            placeholder="server { ... }"
                            spellCheck={false}
                        />
                    </div>
                    {parseError && (
                        <div className="p-4 rounded-lg bg-err-500/10 border border-err-500/20 text-err-400 text-sm">
                            <div className="font-semibold flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4" /> Parse Error
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-xs">{parseError}</pre>
                        </div>
                    )}
                </div>

                {/* Results Column */}
                <div className="space-y-6">
                    {!report && !parseError ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-dark-700 rounded-xl">
                            <Info className="w-12 h-12 text-dark-600 mb-4" />
                            <h3 className="text-lg font-medium text-dark-400">No Config Loaded</h3>
                            <p className="text-dark-500 mt-2">Paste a configuration or load from the generator to see analysis.</p>
                        </div>
                    ) : report ? (
                        <div className="animate-fade-in-up">
                            {/* Score Card */}
                            <div className="p-6 rounded-xl border border-dark-700 bg-surface-raised mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-dark-300">Config Health</h3>
                                    <p className="text-sm text-dark-500">Based on {report.results.length + (report.valid ? 5 : 0)} checks</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`text-3xl font-bold ${getScoreColor(report.score)}`}>{report.score}/100</div>
                                        <div className="text-xs text-dark-500">{report.valid ? 'Valid Config' : 'Issues Found'}</div>
                                    </div>
                                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${getScoreBorderColor(report.score)}`}>
                                        {report.score >= 90 ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <AlertTriangle className="w-8 h-8 text-amber-500" />}
                                    </div>
                                </div>
                            </div>

                            {/* Issues List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">Issues Found</h3>
                                {report.results.length === 0 ? (
                                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5" />
                                        <div>
                                            <div className="font-medium">No issues found</div>
                                            <div className="text-xs opacity-80">Your configuration looks great!</div>
                                        </div>
                                    </div>
                                ) : (
                                    report.results.map((result, idx) => (
                                        <div key={idx} className={`p-4 rounded-lg border flex gap-3 ${getSeverityStyles(result.severity)}`}>
                                            <div className="mt-0.5">
                                                {getSeverityIcon(result.severity)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-medium text-sm">{result.title}</h4>
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/20">{result.category}</span>
                                                </div>
                                                <p className="text-sm opacity-90 mb-3">{result.message}</p>
                                                {result.docsUrl && (
                                                    <Link
                                                        href={result.docsUrl}
                                                        className="text-xs hover:underline inline-flex items-center gap-1 opacity-75 hover:opacity-100"
                                                    >
                                                        Learn more <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                )}
                                            </div>
                                            {availableRules.find(r => r.id === result.ruleId)?.fix && (
                                                <button
                                                    onClick={() => applyFix(result)}
                                                    className="px-3 py-1.5 rounded-lg bg-surface-raised border border-dark-600 hover:bg-dark-700 text-xs font-medium transition-colors flex items-center gap-1.5 self-start group"
                                                >
                                                    <Wrench className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                                                    Fix
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// Simple Deep Merge Utility
function deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

function getScoreColor(score: number) {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-err-500';
}

function getScoreBorderColor(score: number) {
    if (score >= 90) return 'border-emerald-500';
    if (score >= 70) return 'border-amber-500';
    return 'border-err-500';
}

function getSeverityStyles(severity: string) {
    switch (severity) {
        case 'error': return 'bg-err-500/10 border-err-500/20 text-err-400';
        case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
        case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
        default: return 'bg-dark-800 border-dark-700 text-dark-300';
    }
}

function getSeverityIcon(severity: string) {
    switch (severity) {
        case 'error': return <AlertTriangle className="w-5 h-5" />;
        case 'warning': return <AlertTriangle className="w-5 h-5" />;
        case 'info': return <Info className="w-5 h-5" />;
        default: return null;
    }
}
