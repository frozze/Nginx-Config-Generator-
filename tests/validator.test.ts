// ─── Validator Unit Tests ────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/lib/nginx/engine/validator';
import type { NginxConfig } from '../src/lib/nginx/types';

type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

// ── Helper ──
function makeValidConfig(overrides: DeepPartial<NginxConfig> = {}): NginxConfig {
    const defaults: NginxConfig = {
        serverName: 'example.com',
        listenPort: 80,
        listen443: false,
        rootPath: '/var/www/html',
        indexFiles: ['index.html'],
        ssl: {
            enabled: false,
            certificatePath: '/etc/ssl/cert.pem',
            keyPath: '/etc/ssl/key.pem',
            protocols: ['TLSv1.2', 'TLSv1.3'],
            preset: 'intermediate',
            httpRedirect: false,
            enableHSTS: false,
            enableOCSP: false,
        },
        reverseProxy: { enabled: false, backendAddress: '', webSocket: false, realIpHeaders: true, customHeaders: [] },
        locations: [
            { id: '1', path: '/', matchType: 'prefix', type: 'static', root: '/var/www/html', tryFiles: '$uri $uri/ =404', index: '', autoindex: false, cacheExpiry: '', proxyPass: '', proxyWebSocket: false, proxyHeaders: [], redirectUrl: '', redirectCode: 301, customDirectives: '' },
        ],
        security: {
            hideVersion: false,
            securityHeaders: true,
            ipAllowlist: [],
            ipDenylist: [],
            rateLimiting: false,
            rateLimit: 10,
            rateBurst: 20,
            basicAuth: false,
            basicAuthRealm: '',
            basicAuthFile: '',
        },
        performance: {
            gzip: true,
            brotli: false,
            http2: false,
            clientMaxBodySize: 10,
            clientMaxBodyUnit: 'MB',
            keepaliveTimeout: 65,
            workerConnections: 1024,
            staticCaching: false,
            cacheExpiry: '',
            gzipTypes: [],
        },
        logging: {
            accessLog: true,
            accessLogPath: '/var/log/nginx/access.log',
            errorLog: true,
            errorLogPath: '/var/log/nginx/error.log',
            errorLogLevel: 'error',
            customLogFormat: false,
        },
        upstream: {
            enabled: false,
            name: 'backend',
            servers: [],
            method: 'round-robin',
        },
    };

    // Shallow merge top-level
    const config = { ...defaults, ...overrides } as NginxConfig;

    // Merge nested objects
    if (overrides.ssl) config.ssl = { ...defaults.ssl, ...overrides.ssl } as any;
    if (overrides.reverseProxy) config.reverseProxy = { ...defaults.reverseProxy, ...overrides.reverseProxy } as any;
    if (overrides.security) config.security = { ...defaults.security, ...overrides.security } as any;
    if (overrides.performance) config.performance = { ...defaults.performance, ...overrides.performance } as any;
    if (overrides.logging) config.logging = { ...defaults.logging, ...overrides.logging } as any;
    if (overrides.upstream) config.upstream = { ...defaults.upstream, ...overrides.upstream } as any;

    return config;
}

describe('validateConfig', () => {
    it('should return no errors for a valid config', () => {
        const warnings = validateConfig(makeValidConfig());
        const errors = warnings.filter((w) => w.severity === 'error');
        expect(errors).toHaveLength(0);
    });

    it('should warn on invalid domain name', () => {
        const warnings = validateConfig(makeValidConfig({
            serverName: 'not a valid domain!',
        }));
        expect(warnings.some((w) => w.field === 'serverName' && w.severity === 'warning')).toBe(true);
    });

    it('should accept "localhost" as valid server name', () => {
        const warnings = validateConfig(makeValidConfig({
            serverName: 'localhost',
        }));
        const domainWarnings = warnings.filter((w) => w.field === 'serverName' && w.message.includes('valid domain'));
        expect(domainWarnings).toHaveLength(0);
    });

    it('should error on port out of range', () => {
        const warnings = validateConfig(makeValidConfig({
            listenPort: 70000,
        }));
        expect(warnings.some((w) => w.field === 'listenPort' && w.severity === 'error')).toBe(true);
    });

    it('should warn when SSL is enabled but cert path is missing', () => {
        const warnings = validateConfig(makeValidConfig({
            ssl: {
                enabled: true,
                certificatePath: '',
            },
        }));
        expect(warnings.some((w) => w.field === 'ssl.certificatePath')).toBe(true);
    });

    it('should error on duplicate location paths', () => {
        const warnings = validateConfig(makeValidConfig({
            locations: [
                { id: '1', path: '/api', matchType: 'prefix', type: 'proxy', proxyPass: 'http://localhost:3000', proxyWebSocket: false, proxyHeaders: [], root: '', tryFiles: '', index: '', autoindex: false, cacheExpiry: '', redirectUrl: '', redirectCode: 301, customDirectives: '' },
                { id: '2', path: '/api', matchType: 'prefix', type: 'proxy', proxyPass: 'http://localhost:3001', proxyWebSocket: false, proxyHeaders: [], root: '', tryFiles: '', index: '', autoindex: false, cacheExpiry: '', redirectUrl: '', redirectCode: 301, customDirectives: '' },
            ],
        }));
        expect(warnings.some((w) => w.message.includes('Duplicate') && w.severity === 'error')).toBe(true);
    });

    it('should warn when upstream is enabled but has no servers', () => {
        const warnings = validateConfig(makeValidConfig({
            upstream: {
                enabled: true,
                name: 'orphan_upstream',
                servers: [],
            },
        }));
        expect(warnings.some((w) => w.field === 'upstream')).toBe(true);
    });

    it('should error on empty upstream server address', () => {
        const warnings = validateConfig(makeValidConfig({
            upstream: {
                enabled: true,
                name: 'backend',
                servers: [{ id: '1', address: '', weight: 1, maxFails: 1, failTimeout: 10 }],
            },
        }));
        expect(warnings.some((w) => w.field === 'upstream.servers' && w.severity === 'error')).toBe(true);
    });

    it('should error on proxy location with no proxyPass', () => {
        const warnings = validateConfig(makeValidConfig({
            locations: [
                { id: '1', path: '/api', matchType: 'prefix', type: 'proxy', proxyPass: '', proxyWebSocket: false, proxyHeaders: [], root: '', tryFiles: '', index: '', autoindex: false, cacheExpiry: '', redirectUrl: '', redirectCode: 301, customDirectives: '' },
            ],
        }));
        expect(warnings.some((w) => w.field === 'locations.proxy' && w.severity === 'error')).toBe(true);
    });
});
