// ─── Validator Unit Tests ────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/lib/nginx/engine/validator';
import type { NginxFullConfig } from '../src/lib/nginx/engine/types';

// ── Helper ──
function makeValidConfig(overrides?: Partial<NginxFullConfig>): NginxFullConfig {
    return {
        server: {
            serverName: ['example.com'],
            listenPort: 80,
            listenIPv6: true,
            root: '/var/www/html',
            index: ['index.html'],
        },
        locations: [
            { path: '/', matchType: 'prefix', type: 'static', static: { root: '/var/www/html', tryFiles: '$uri $uri/ =404' } },
        ],
        security: {
            serverTokens: false,
            securityHeaders: { xContentTypeOptions: true },
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

describe('validateConfig', () => {
    it('should return no errors for a valid config', () => {
        const warnings = validateConfig(makeValidConfig());
        const errors = warnings.filter((w) => w.severity === 'error');
        expect(errors).toHaveLength(0);
    });

    it('should warn on invalid domain name', () => {
        const warnings = validateConfig(makeValidConfig({
            server: { serverName: ['not a valid domain!'], listenPort: 80, listenIPv6: true },
        }));
        expect(warnings.some((w) => w.field === 'server.serverName' && w.severity === 'warning')).toBe(true);
    });

    it('should accept "localhost" as valid server name', () => {
        const warnings = validateConfig(makeValidConfig({
            server: { serverName: ['localhost'], listenPort: 80, listenIPv6: true },
        }));
        const domainWarnings = warnings.filter((w) => w.field === 'server.serverName' && w.message.includes('valid domain'));
        expect(domainWarnings).toHaveLength(0);
    });

    it('should accept "_" (catch-all) as valid server name', () => {
        const warnings = validateConfig(makeValidConfig({
            server: { serverName: ['_'], listenPort: 80, listenIPv6: true },
        }));
        const domainWarnings = warnings.filter((w) => w.field === 'server.serverName' && w.message.includes('valid domain'));
        expect(domainWarnings).toHaveLength(0);
    });

    it('should error on port out of range', () => {
        const warnings = validateConfig(makeValidConfig({
            server: { serverName: ['example.com'], listenPort: 70000, listenIPv6: true },
        }));
        expect(warnings.some((w) => w.field === 'server.listenPort' && w.severity === 'error')).toBe(true);
    });

    it('should warn when SSL is enabled but cert path is missing', () => {
        const warnings = validateConfig(makeValidConfig({
            ssl: {
                enabled: true,
                certPath: '',
                keyPath: '/etc/ssl/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'intermediate',
                httpRedirect: false,
                hsts: false,
                ocspStapling: false,
            },
        }));
        expect(warnings.some((w) => w.field === 'ssl.certPath')).toBe(true);
    });

    it('should warn when SSL key path does not start with /', () => {
        const warnings = validateConfig(makeValidConfig({
            ssl: {
                enabled: true,
                certPath: '/etc/ssl/cert.pem',
                keyPath: 'relative/path/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'intermediate',
                httpRedirect: false,
                hsts: false,
                ocspStapling: false,
            },
        }));
        expect(warnings.some((w) => w.field === 'ssl.keyPath')).toBe(true);
    });

    it('should error on duplicate location paths', () => {
        const warnings = validateConfig(makeValidConfig({
            locations: [
                { path: '/api', matchType: 'prefix', type: 'proxy', proxy: { backendAddress: 'http://localhost:3000', websocket: false, passRealIP: true, customHeaders: {} } },
                { path: '/api', matchType: 'prefix', type: 'proxy', proxy: { backendAddress: 'http://localhost:3001', websocket: false, passRealIP: true, customHeaders: {} } },
            ],
        }));
        expect(warnings.some((w) => w.message.includes('Duplicate') && w.severity === 'error')).toBe(true);
    });

    it('should NOT flag locations with same path but different match types as duplicates', () => {
        const warnings = validateConfig(makeValidConfig({
            locations: [
                { path: '/api', matchType: 'prefix', type: 'proxy', proxy: { backendAddress: 'http://localhost:3000', websocket: false, passRealIP: true, customHeaders: {} } },
                { path: '/api', matchType: 'exact', type: 'proxy', proxy: { backendAddress: 'http://localhost:3001', websocket: false, passRealIP: true, customHeaders: {} } },
            ],
        }));
        expect(warnings.some((w) => w.message.includes('Duplicate'))).toBe(false);
    });

    it('should warn when upstream is defined but not referenced', () => {
        const warnings = validateConfig(makeValidConfig({
            upstream: {
                name: 'orphan_upstream',
                servers: [{ address: 'localhost:3001' }],
                method: 'round_robin',
            },
            locations: [
                { path: '/', matchType: 'prefix', type: 'static', static: { root: '/var/www', tryFiles: '$uri $uri/ =404' } },
            ],
        }));
        expect(warnings.some((w) => w.field === 'upstream' && w.message.includes('not referenced'))).toBe(true);
    });

    it('should NOT warn when upstream is referenced in proxy_pass', () => {
        const warnings = validateConfig(makeValidConfig({
            upstream: {
                name: 'my_backend',
                servers: [{ address: 'localhost:3001' }],
                method: 'round_robin',
            },
            locations: [
                { path: '/', matchType: 'prefix', type: 'proxy', proxy: { backendAddress: 'http://my_backend', websocket: false, passRealIP: true, customHeaders: {} } },
            ],
        }));
        expect(warnings.some((w) => w.field === 'upstream' && w.message.includes('not referenced'))).toBe(false);
    });

    it('should error on gzip compression level out of range', () => {
        const warnings = validateConfig(makeValidConfig({
            performance: {
                gzip: { enabled: true, compLevel: 15, minLength: 256, types: ['text/plain'] },
                http2: false,
                clientMaxBodySize: '10M',
                keepaliveTimeout: 65,
                sendfile: true,
                tcpNopush: true,
                tcpNodelay: true,
            },
        }));
        expect(warnings.some((w) => w.field === 'performance.gzip.compLevel' && w.severity === 'error')).toBe(true);
    });

    it('should warn on client max body size over 1GB', () => {
        const warnings = validateConfig(makeValidConfig({
            performance: {
                http2: false,
                clientMaxBodySize: '2G',
                keepaliveTimeout: 65,
                sendfile: true,
                tcpNopush: true,
                tcpNodelay: true,
            },
        }));
        expect(warnings.some((w) => w.field === 'performance.clientMaxBodySize')).toBe(true);
    });

    it('should warn on HSTS max-age less than 1 day', () => {
        const warnings = validateConfig(makeValidConfig({
            ssl: {
                enabled: true,
                certPath: '/etc/ssl/cert.pem',
                keyPath: '/etc/ssl/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'intermediate',
                httpRedirect: false,
                hsts: true,
                hstsMaxAge: 3600, // 1 hour — too short
                ocspStapling: false,
            },
        }));
        expect(warnings.some((w) => w.field === 'ssl.hstsMaxAge')).toBe(true);
    });

    it('should warn when HTTP/2 is enabled without SSL', () => {
        const warnings = validateConfig(makeValidConfig({
            performance: {
                http2: true,
                clientMaxBodySize: '10M',
                keepaliveTimeout: 65,
                sendfile: true,
                tcpNopush: true,
                tcpNodelay: true,
            },
        }));
        expect(warnings.some((w) => w.field === 'performance.http2')).toBe(true);
    });

    it('should error on empty upstream server address', () => {
        const warnings = validateConfig(makeValidConfig({
            upstream: {
                name: 'backend',
                servers: [{ address: '' }],
                method: 'round_robin',
            },
        }));
        expect(warnings.some((w) => w.field === 'upstream.servers' && w.severity === 'error')).toBe(true);
    });

    it('should error on proxy location with no backend address', () => {
        const warnings = validateConfig(makeValidConfig({
            locations: [
                { path: '/api', matchType: 'prefix', type: 'proxy', proxy: { backendAddress: '', websocket: false, passRealIP: true, customHeaders: {} } },
            ],
        }));
        expect(warnings.some((w) => w.field === 'locations.proxy' && w.severity === 'error')).toBe(true);
    });

    it('should info on DH params recommended for intermediate preset', () => {
        const warnings = validateConfig(makeValidConfig({
            ssl: {
                enabled: true,
                certPath: '/etc/ssl/cert.pem',
                keyPath: '/etc/ssl/key.pem',
                protocols: ['TLSv1.2', 'TLSv1.3'],
                preset: 'intermediate',
                httpRedirect: false,
                hsts: false,
                ocspStapling: false,
                // no dhParamPath
            },
        }));
        expect(warnings.some((w) => w.field === 'ssl.dhParamPath' && w.severity === 'info')).toBe(true);
    });
});
