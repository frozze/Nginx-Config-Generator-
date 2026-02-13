// ─── Generator Unit Tests ────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { generateNginxConfig } from '../src/lib/nginx/engine/generator';
import { presetConfigs } from '../src/lib/nginx/engine/presets';
import type { NginxFullConfig } from '../src/lib/nginx/engine/types';

// ── Minimal valid config for testing ──
function makeMinimalConfig(overrides?: Partial<NginxFullConfig>): NginxFullConfig {
    return {
        server: {
            serverName: ['example.com'],
            listenPort: 80,
            listenIPv6: true,
            root: '/var/www/html',
            index: ['index.html'],
        },
        locations: [],
        security: {
            serverTokens: false,
            securityHeaders: {
                xContentTypeOptions: true,
            },
        },
        performance: {
            http2: false,
            clientMaxBodySize: '10M',
            keepaliveTimeout: 65,
            sendfile: true,
            tcpNopush: true,
            tcpNodelay: true,
        },
        logging: {
            accessLog: { enabled: true, path: '/var/log/nginx/access.log' },
            errorLog: { enabled: true, path: '/var/log/nginx/error.log', level: 'error' },
        },
        ...overrides,
    };
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

    it('should include listen directives with IPv6', () => {
        const result = generateNginxConfig(makeMinimalConfig());
        expect(result.config).toContain('listen 80;');
        expect(result.config).toContain('listen [::]:80;');
    });

    it('should generate SSL redirect block when httpRedirect is true', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            server: {
                serverName: ['example.com'],
                listenPort: 443,
                listenIPv6: true,
            },
            ssl: {
                enabled: true,
                certPath: '/etc/ssl/cert.pem',
                keyPath: '/etc/ssl/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'intermediate',
                httpRedirect: true,
                hsts: true,
                ocspStapling: true,
            },
        }));

        // Should have two server blocks — redirect + main
        expect(result.config).toContain('listen 80;');
        expect(result.config).toContain('return 301 https://$server_name$request_uri;');
        expect(result.config).toContain('listen 443 ssl;');
        expect(result.config).toContain('ssl_certificate /etc/ssl/cert.pem;');
    });

    it('should NOT generate SSL redirect block when httpRedirect is false', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            server: {
                serverName: ['example.com'],
                listenPort: 443,
                listenIPv6: true,
            },
            ssl: {
                enabled: true,
                certPath: '/etc/ssl/cert.pem',
                keyPath: '/etc/ssl/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'modern',
                httpRedirect: false,
                hsts: false,
                ocspStapling: false,
            },
            performance: {
                http2: true,
                clientMaxBodySize: '10M',
                keepaliveTimeout: 65,
                sendfile: true,
                tcpNopush: true,
                tcpNodelay: true,
            },
        }));

        expect(result.config).not.toContain('return 301');
    });

    it('should generate upstream block when defined', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            upstream: {
                name: 'my_backend',
                servers: [
                    { address: '10.0.0.1:8080', weight: 3, maxFails: 3, failTimeout: '30s' },
                    { address: '10.0.0.2:8080', weight: 2 },
                    { address: '10.0.0.3:8080', backup: true },
                ],
                method: 'least_conn',
                keepalive: 32,
            },
            locations: [
                {
                    path: '/',
                    matchType: 'prefix',
                    type: 'proxy',
                    proxy: {
                        backendAddress: 'http://my_backend',
                        websocket: false,
                        passRealIP: true,
                        customHeaders: {},
                    },
                },
            ],
        }));

        expect(result.config).toContain('upstream my_backend {');
        expect(result.config).toContain('least_conn;');
        expect(result.config).toContain('server 10.0.0.1:8080 weight=3');
        expect(result.config).toContain('backup');
        expect(result.config).toContain('keepalive 32;');
        expect(result.config).toContain('proxy_pass http://my_backend;');
    });

    it('should generate locations in correct order', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            locations: [
                { path: '/', matchType: 'prefix', type: 'static', static: { root: '/var/www', tryFiles: '$uri $uri/ =404' } },
                { path: '/api', matchType: 'prefix', type: 'proxy', proxy: { backendAddress: 'http://localhost:3000', websocket: false, passRealIP: true, customHeaders: {} } },
                { path: '/health', matchType: 'exact', type: 'proxy', proxy: { backendAddress: 'http://localhost:3000', websocket: false, passRealIP: false, customHeaders: {} } },
            ],
        }));

        const rootIdx = result.config.indexOf('location / {');
        const apiIdx = result.config.indexOf('location /api {');
        const healthIdx = result.config.indexOf('location = /health {');

        expect(rootIdx).toBeLessThan(apiIdx);
        expect(apiIdx).toBeLessThan(healthIdx);
    });

    it('should generate default location / when no locations are defined', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            locations: [],
        }));

        expect(result.config).toContain('location / {');
        expect(result.config).toContain('try_files $uri $uri/ =404;');
    });

    it('should generate gzip directives when enabled', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            performance: {
                gzip: {
                    enabled: true,
                    compLevel: 6,
                    minLength: 256,
                    types: ['text/plain', 'text/css', 'application/json'],
                },
                http2: false,
                clientMaxBodySize: '10M',
                keepaliveTimeout: 65,
                sendfile: true,
                tcpNopush: true,
                tcpNodelay: true,
            },
        }));

        expect(result.config).toContain('gzip on;');
        expect(result.config).toContain('gzip_comp_level 6;');
        expect(result.config).toContain('gzip_min_length 256;');
        expect(result.config).toContain('gzip_types text/plain text/css application/json;');
    });

    it('should generate security headers', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            security: {
                serverTokens: false,
                securityHeaders: {
                    xFrameOptions: 'DENY',
                    xContentTypeOptions: true,
                    referrerPolicy: 'no-referrer',
                    contentSecurityPolicy: "default-src 'self'",
                },
            },
        }));

        expect(result.config).toContain('server_tokens off;');
        expect(result.config).toContain('X-Frame-Options "DENY"');
        expect(result.config).toContain('X-Content-Type-Options "nosniff"');
        expect(result.config).toContain('Referrer-Policy "no-referrer"');
        expect(result.config).toContain("Content-Security-Policy");
    });

    it('should handle WebSocket proxy configuration', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            locations: [
                {
                    path: '/ws',
                    matchType: 'prefix',
                    type: 'proxy',
                    proxy: {
                        backendAddress: 'http://localhost:3000',
                        websocket: true,
                        passRealIP: true,
                        customHeaders: {},
                    },
                },
            ],
        }));

        expect(result.config).toContain('proxy_set_header Upgrade $http_upgrade;');
        expect(result.config).toContain('proxy_set_header Connection "upgrade";');
    });

    it('should generate HSTS header when enabled', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            server: { serverName: ['example.com'], listenPort: 443, listenIPv6: true },
            ssl: {
                enabled: true,
                certPath: '/etc/ssl/cert.pem',
                keyPath: '/etc/ssl/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'intermediate',
                httpRedirect: false,
                hsts: true,
                hstsMaxAge: 31536000,
                ocspStapling: false,
            },
        }));

        expect(result.config).toContain('Strict-Transport-Security "max-age=31536000;');
    });

    it('should generate rate limiting directives', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            security: {
                serverTokens: false,
                securityHeaders: { xContentTypeOptions: true },
                rateLimit: {
                    enabled: true,
                    zone: '$binary_remote_addr zone=req_limit:10m rate=10r/s',
                    requests: 10,
                    burst: 20,
                    nodelay: true,
                },
            },
            locations: [
                { path: '/', matchType: 'prefix', type: 'static', static: { root: '/var/www', tryFiles: '$uri $uri/ =404' } },
            ],
        }));

        expect(result.config).toContain('limit_req_zone');
        expect(result.config).toContain('limit_req zone=req_limit burst=20 nodelay;');
    });

    it('should handle all sections enabled simultaneously', () => {
        const result = generateNginxConfig({
            server: { serverName: ['example.com'], listenPort: 443, listenIPv6: true, root: '/var/www', index: ['index.html'] },
            ssl: {
                enabled: true,
                certPath: '/etc/ssl/cert.pem',
                keyPath: '/etc/ssl/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'intermediate',
                httpRedirect: true,
                hsts: true,
                ocspStapling: true,
            },
            upstream: {
                name: 'backends',
                servers: [{ address: 'localhost:3001' }, { address: 'localhost:3002' }],
                method: 'ip_hash',
            },
            locations: [
                { path: '/', matchType: 'prefix', type: 'proxy', proxy: { backendAddress: 'http://backends', websocket: true, passRealIP: true, customHeaders: { 'X-Custom': 'yes' } } },
                { path: '/static', matchType: 'prefix', type: 'static', static: { root: '/var/www/static', expires: '30d' } },
                { path: '/old-page', matchType: 'exact', type: 'redirect', redirect: { target: '/new-page', code: 301 } },
            ],
            security: {
                serverTokens: false,
                securityHeaders: { xFrameOptions: 'SAMEORIGIN', xContentTypeOptions: true, referrerPolicy: 'strict-origin' },
                rateLimit: { enabled: true, zone: '$binary_remote_addr zone=req_limit:10m rate=5r/s', requests: 5, burst: 10, nodelay: true },
                basicAuth: { realm: 'Admin', htpasswdPath: '/etc/nginx/.htpasswd' },
            },
            performance: {
                gzip: { enabled: true, compLevel: 4, minLength: 512, types: ['text/plain', 'application/json'] },
                brotli: true,
                http2: true,
                clientMaxBodySize: '50M',
                keepaliveTimeout: 120,
                sendfile: true,
                tcpNopush: true,
                tcpNodelay: true,
                staticCaching: { images: '30d', css: '7d', js: '7d', fonts: '60d' },
            },
            logging: {
                accessLog: { enabled: true, path: '/var/log/nginx/access.log' },
                errorLog: { enabled: true, path: '/var/log/nginx/error.log', level: 'warn' },
            },
        });

        expect(result.config).toBeTruthy();
        expect(result.config).toContain('upstream backends');
        expect(result.config).toContain('limit_req_zone');
        expect(result.config).toContain('return 301 https://');
        expect(result.config).toContain('ssl_certificate');
        expect(result.config).toContain('server_tokens off');
        expect(result.config).toContain('gzip on');
        expect(result.config).toContain('brotli on');
        expect(result.config).toContain('proxy_pass http://backends');
        expect(result.config).toContain('return 301 /new-page');
        expect(result.config).toContain('auth_basic');
        expect(result.config).toContain('access_log');
        expect(result.config).toContain('error_log');

        // Should use 4-space indentation
        expect(result.config).toContain('    listen');
    });

    it('should generate each preset as a non-empty config', () => {
        for (const [name, config] of Object.entries(presetConfigs)) {
            const result = generateNginxConfig(config);
            expect(result.config, `Preset "${name}" should produce non-empty config`).toBeTruthy();
            expect(result.config.length, `Preset "${name}" config should be substantial`).toBeGreaterThan(100);
            expect(result.config, `Preset "${name}" should contain a server block`).toContain('server {');
        }
    });

    it('should generate proxy timeouts when specified', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            locations: [{
                path: '/',
                matchType: 'prefix',
                type: 'proxy',
                proxy: {
                    backendAddress: 'http://localhost:3000',
                    websocket: false,
                    passRealIP: false,
                    customHeaders: {},
                    proxyConnectTimeout: 10,
                    proxyReadTimeout: 60,
                    proxySendTimeout: 30,
                    proxyBuffering: false,
                },
            }],
        }));

        expect(result.config).toContain('proxy_connect_timeout 10s;');
        expect(result.config).toContain('proxy_read_timeout 60s;');
        expect(result.config).toContain('proxy_send_timeout 30s;');
        expect(result.config).toContain('proxy_buffering off;');
    });

    it('should generate static caching location blocks', () => {
        const result = generateNginxConfig(makeMinimalConfig({
            performance: {
                http2: false,
                clientMaxBodySize: '10M',
                keepaliveTimeout: 65,
                sendfile: true,
                tcpNopush: true,
                tcpNodelay: true,
                staticCaching: {
                    images: '30d',
                    css: '7d',
                    js: '14d',
                    fonts: '60d',
                },
            },
        }));

        expect(result.config).toContain('location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp|avif)$');
        expect(result.config).toContain('expires 30d;');
        expect(result.config).toContain('location ~* \\.css$');
        expect(result.config).toContain('location ~* \\.js$');
        expect(result.config).toContain('location ~* \\.(woff2?|ttf|eot|otf)$');
    });
});
