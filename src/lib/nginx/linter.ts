import { NginxConfig } from './types';

export type LintCategory = 'security' | 'performance' | 'correctness' | 'best-practice';
export type LintSeverity = 'error' | 'warning' | 'info';

export interface LintRule {
    id: string;
    title: string;
    message: string;
    category: LintCategory;
    severity: LintSeverity;
    /**
     * Returns true if the rule is VIOLATED (i.e., an issue is found).
     */
    test: (config: NginxConfig) => boolean;
    /**
     * Returns a partial config object to merge to fix the issue.
     */
    fix?: (config: NginxConfig) => Partial<NginxConfig>;
    docsUrl?: string;
}

export interface LintResult {
    ruleId: string;
    severity: LintSeverity;
    title: string;
    message: string;
    category: LintCategory;
    docsUrl?: string;
}

export interface LintReport {
    valid: boolean;
    score: number;
    results: LintResult[];
    counts: {
        error: number;
        warning: number;
        info: number;
    };
}

const rules: LintRule[] = [
    // ─── Security ─────────────────────────────────────────────────────────────
    {
        id: 'security-server-tokens',
        title: 'Server Tokens Visible',
        message: 'Nginx version is visible in error pages and headers. Disable server_tokens to obscure version info.',
        category: 'security',
        severity: 'warning',
        test: (c) => !c.security.hideVersion, // Violated if hideVersion is false
        fix: () => ({ security: { hideVersion: true } } as any),
        docsUrl: '/docs/lint/security-server-tokens',
    },
    {
        id: 'security-headers-missing',
        title: 'Missing Security Headers',
        message: 'Standard security headers (X-Frame-Options, X-Content-Type-Options, etc.) are disabled.',
        category: 'security',
        severity: 'error',
        test: (c) => !c.security.securityHeaders,
        fix: () => ({ security: { securityHeaders: true } } as any),
        docsUrl: '/docs/lint/security-headers-missing',
    },
    {
        id: 'security-ssl-missing',
        title: 'SSL/TLS Disabled',
        message: 'Site is served over HTTP. Enable SSL/TLS for encryption.',
        category: 'security',
        severity: 'error',
        test: (c) => !c.ssl.enabled && c.listenPort === 80,
        // Fix is complex (requires cert paths), so no auto-fix provided here generally, 
        // or we could enable it with placeholders.
        docsUrl: '/docs/lint/security-ssl-missing',
    },
    {
        id: 'security-upstream-needs-ssl',
        title: 'Upstream Traffic Unencrypted',
        message: 'Proxying to a remote backend without HTTPS. Consider using SSL between Nginx and Upstream if traversing public networks.',
        category: 'security',
        severity: 'info',
        test: (c) => c.reverseProxy.enabled && c.reverseProxy.backendAddress.startsWith('http://') && !c.reverseProxy.backendAddress.includes('localhost') && !c.reverseProxy.backendAddress.includes('127.0.0.1'),
        docsUrl: '/docs/lint/security-upstream-needs-ssl',
    },

    // ─── Performance ──────────────────────────────────────────────────────────
    {
        id: 'perf-gzip-disabled',
        title: 'Gzip Compression Disabled',
        message: 'Gzip compression is disabled. Enable it to reduce bandwidth usage and improve load times.',
        category: 'performance',
        severity: 'warning',
        test: (c) => !c.performance.gzip,
        fix: () => ({ performance: { gzip: true } } as any),
        docsUrl: '/docs/lint/perf-gzip-disabled',
    },
    {
        id: 'perf-http2-disabled',
        title: 'HTTP/2 Disabled',
        message: 'HTTP/2 is not enabled. Enable it for better multiplexing and performance over SSL.',
        category: 'performance',
        severity: 'info',
        test: (c) => c.ssl.enabled && !c.performance.http2,
        fix: () => ({ performance: { http2: true } } as any),
        docsUrl: '/docs/lint/perf-http2-disabled',
    },

    // ─── Correctness / Best Practice ──────────────────────────────────────────
    {
        id: 'bp-worker-connections-low',
        title: 'Low Worker Connections',
        message: 'Worker connections is set low (< 1024). Default is usually 1024 or higher for production.',
        category: 'best-practice',
        severity: 'warning',
        test: (c) => c.performance.workerConnections < 1024,
        fix: () => ({ performance: { workerConnections: 1024 } } as any),
        docsUrl: '/docs/lint/bp-worker-connections-low',
    },
    {
        id: 'bp-keepalive-timeout-high',
        title: 'High Keepalive Timeout',
        message: 'Keepalive timeout > 75s. Nginx default is 75s. Higher values may waste resources.',
        category: 'best-practice',
        severity: 'info',
        test: (c) => c.performance.keepaliveTimeout > 75,
        fix: () => ({ performance: { keepaliveTimeout: 65 } } as any),
        docsUrl: '/docs/lint/bp-keepalive-timeout-high',
    },
];

export function lintConfig(config: NginxConfig): LintReport {
    const results: LintResult[] = [];
    const counts = { error: 0, warning: 0, info: 0 };

    for (const rule of rules) {
        try {
            if (rule.test(config)) {
                results.push({
                    ruleId: rule.id,
                    severity: rule.severity,
                    title: rule.title,
                    message: rule.message,
                    category: rule.category,
                    docsUrl: rule.docsUrl,
                });
                counts[rule.severity]++;
            }
        } catch (err) {
            console.error(`Error running lint rule ${rule.id}:`, err);
        }
    }

    // simple score calculation
    // Start at 100
    // Error: -20
    // Warning: -10
    // Info: -2
    let score = 100;
    score -= (counts.error * 20);
    score -= (counts.warning * 10);
    score -= (counts.info * 2);

    return {
        valid: counts.error === 0,
        score: Math.max(0, score),
        results,
        counts,
    };
}

export const availableRules = rules;
