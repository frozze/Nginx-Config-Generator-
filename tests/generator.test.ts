// ─── Generator Unit Tests ────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { generateNginxConfig } from '../src/lib/nginx/engine/generator';
import type { NginxConfig } from '../src/lib/nginx/types';

type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

// ── Minimal valid config for testing ──
function makeMinimalConfig(overrides: DeepPartial<NginxConfig> = {}): NginxConfig {
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
        locations: [],
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

describe('generateNginxConfig', () => {
    it('should generate a non-empty config string for minimal input', () => {
        const result = generateNginxConfig(makeMinimalConfig());
        expect(result.config).toBeTruthy();
        expect(result.config.length).toBeGreaterThan(50);
        expect(result.config).toContain('server {');
        expect(result.config).toContain('}');
    });

    it('should include server_name directive', () => {
        const result = generateNginxConfig(makeMinimalConfig());
        expect(result.config).toContain('server_name example.com;');
    });

    it('should include listen directives', () => {
        const result = generateNginxConfig(makeMinimalConfig());
        expect(result.config).toContain('listen 80;');
        expect(result.config).toContain('listen [::]:80;');
    });

    it('should generate SSL redirect block when httpRedirect is true', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            listenPort: 443,
            listen443: true,
            ssl: {
                enabled: true,
                httpRedirect: true,
            },
        }));

        expect(result.config).toContain('listen 80;');
        expect(result.config).toContain('return 301 https://$server_name$request_uri;');
        expect(result.config).toContain('listen 443 ssl;');
        expect(result.config).toContain('ssl_certificate /etc/ssl/cert.pem;');
    });

    it('should generate upstream block when enabled', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            upstream: {
                enabled: true,
                name: 'my_backend',
                servers: [
                    { id: '1', address: '10.0.0.1:8080', weight: 3, maxFails: 3, failTimeout: 30 },
                    { id: '2', address: '10.0.0.2:8080', weight: 2, maxFails: 3, failTimeout: 30 },
                ],
                method: 'least_conn',
            },
            locations: [
                {
                    id: '1',
                    path: '/',
                    matchType: 'prefix',
                    type: 'proxy',
                    proxyPass: 'http://my_backend',
                    proxyWebSocket: false,
                    proxyHeaders: [],
                    root: '', tryFiles: '', index: '', autoindex: false,
                    cacheExpiry: '', redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
                },
            ],
        }));

        expect(result.config).toContain('upstream my_backend {');
        expect(result.config).toContain('least_conn;');
        expect(result.config).toContain('server 10.0.0.1:8080 weight=3');
        expect(result.config).toContain('proxy_pass http://my_backend;');
    });

    it('should generate gzip directives when enabled', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            performance: {
                gzip: true,
                gzipTypes: ['text/plain', 'text/css'],
            },
        }));

        expect(result.config).toContain('gzip on;');
        expect(result.config).toContain('gzip_types text/plain text/css;');
    });

    it('should generate security headers', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            security: {
                securityHeaders: true,
            },
        }));

        expect(result.config).toContain('X-Frame-Options "SAMEORIGIN"');
        expect(result.config).toContain('X-Content-Type-Options "nosniff"');
    });

    it('should handle WebSocket proxy configuration', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            locations: [
                {
                    id: 'ws',
                    path: '/ws',
                    matchType: 'prefix',
                    type: 'proxy',
                    proxyPass: 'http://localhost:3000',
                    proxyWebSocket: true,
                    proxyHeaders: [],
                    root: '', tryFiles: '', index: '', autoindex: false,
                    cacheExpiry: '', redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
                },
            ],
        }));

        expect(result.config).toContain('proxy_set_header Upgrade $http_upgrade;');
        expect(result.config).toContain('proxy_set_header Connection "upgrade";');
    });

    it('should generate rate limiting directives', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            security: {
                rateLimiting: true,
                rateLimit: 10,
                rateBurst: 20,
            },
        }));

        expect(result.config).toContain('limit_req_zone');
        expect(result.config).toContain('limit_req zone=req_limit burst=20 nodelay;');
    });
});
