// ─── Zustand Store — Nginx Config State ────────────────────────────────────
'use client';
import { create } from 'zustand';
import type { NginxConfig, LocationConfig, UpstreamServer } from '@/lib/nginx/types';

export function createDefaultLocation(id?: string): LocationConfig {
    return {
        id: id || crypto.randomUUID(),
        path: '/',
        type: 'static',
        root: '/var/www/html',
        tryFiles: '$uri $uri/ =404',
        index: 'index.html',
        autoindex: false,
        cacheExpiry: '',
        proxyPass: '',
        proxyWebSocket: false,
        proxyHeaders: [],
        redirectUrl: '',
        redirectCode: 301,
        customDirectives: '',
    };
}

export function createDefaultUpstreamServer(id?: string): UpstreamServer {
    return {
        id: id || crypto.randomUUID(),
        address: '127.0.0.1:8080',
        weight: 1,
        maxFails: 3,
        failTimeout: 30,
    };
}

export function createDefaultConfig(): NginxConfig {
    return {
        serverName: 'example.com',
        listenPort: 80,
        listen443: true,
        rootPath: '/var/www/html',
        indexFiles: ['index.html', 'index.htm'],
        ssl: {
            enabled: false,
            certificatePath: '/etc/letsencrypt/live/example.com/fullchain.pem',
            keyPath: '/etc/letsencrypt/live/example.com/privkey.pem',
            httpRedirect: true,
            protocols: ['TLSv1.2', 'TLSv1.3'],
            enableHSTS: true,
            enableOCSP: true,
            preset: 'intermediate',
        },
        reverseProxy: {
            enabled: false,
            backendAddress: 'http://127.0.0.1:3000',
            webSocket: false,
            realIpHeaders: true,
            customHeaders: [],
        },
        locations: [],
        security: {
            rateLimiting: false,
            rateLimit: 10,
            rateBurst: 20,
            securityHeaders: false,
            hideVersion: true,
            ipAllowlist: [],
            ipDenylist: [],
            basicAuth: false,
            basicAuthRealm: 'Restricted',
            basicAuthFile: '/etc/nginx/.htpasswd',
        },
        performance: {
            gzip: false,
            gzipTypes: ['text/plain', 'text/css', 'application/json', 'application/javascript', 'text/xml', 'application/xml', 'image/svg+xml'],
            brotli: false,
            staticCaching: false,
            cacheExpiry: '30d',
            http2: false,
            clientMaxBodySize: 1,
            clientMaxBodyUnit: 'MB',
            keepaliveTimeout: 65,
            workerConnections: 1024,
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
}

interface ConfigStore {
    config: NginxConfig;
    setConfig: (config: NginxConfig) => void;
    resetConfig: () => void;
    updateBasic: (data: Partial<Pick<NginxConfig, 'serverName' | 'listenPort' | 'listen443' | 'rootPath' | 'indexFiles'>>) => void;
    updateSSL: (data: Partial<NginxConfig['ssl']>) => void;
    updateReverseProxy: (data: Partial<NginxConfig['reverseProxy']>) => void;
    updateSecurity: (data: Partial<NginxConfig['security']>) => void;
    updatePerformance: (data: Partial<NginxConfig['performance']>) => void;
    updateLogging: (data: Partial<NginxConfig['logging']>) => void;
    updateUpstream: (data: Partial<NginxConfig['upstream']>) => void;
    // Location management
    addLocation: () => void;
    removeLocation: (id: string) => void;
    updateLocation: (id: string, data: Partial<LocationConfig>) => void;
    // Upstream server management
    addUpstreamServer: () => void;
    removeUpstreamServer: (id: string) => void;
    updateUpstreamServer: (id: string, data: Partial<UpstreamServer>) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
    config: createDefaultConfig(),

    setConfig: (config) => set({ config }),

    resetConfig: () => set({ config: createDefaultConfig() }),

    updateBasic: (data) =>
        set((state) => ({ config: { ...state.config, ...data } })),

    updateSSL: (data) =>
        set((state) => ({ config: { ...state.config, ssl: { ...state.config.ssl, ...data } } })),

    updateReverseProxy: (data) =>
        set((state) => ({
            config: { ...state.config, reverseProxy: { ...state.config.reverseProxy, ...data } },
        })),

    updateSecurity: (data) =>
        set((state) => ({
            config: { ...state.config, security: { ...state.config.security, ...data } },
        })),

    updatePerformance: (data) =>
        set((state) => ({
            config: { ...state.config, performance: { ...state.config.performance, ...data } },
        })),

    updateLogging: (data) =>
        set((state) => ({
            config: { ...state.config, logging: { ...state.config.logging, ...data } },
        })),

    updateUpstream: (data) =>
        set((state) => ({
            config: { ...state.config, upstream: { ...state.config.upstream, ...data } },
        })),

    addLocation: () =>
        set((state) => ({
            config: {
                ...state.config,
                locations: [...state.config.locations, createDefaultLocation()],
            },
        })),

    removeLocation: (id) =>
        set((state) => ({
            config: {
                ...state.config,
                locations: state.config.locations.filter((l) => l.id !== id),
            },
        })),

    updateLocation: (id, data) =>
        set((state) => ({
            config: {
                ...state.config,
                locations: state.config.locations.map((l) =>
                    l.id === id ? { ...l, ...data } : l
                ),
            },
        })),

    addUpstreamServer: () =>
        set((state) => ({
            config: {
                ...state.config,
                upstream: {
                    ...state.config.upstream,
                    servers: [...state.config.upstream.servers, createDefaultUpstreamServer()],
                },
            },
        })),

    removeUpstreamServer: (id) =>
        set((state) => ({
            config: {
                ...state.config,
                upstream: {
                    ...state.config.upstream,
                    servers: state.config.upstream.servers.filter((s) => s.id !== id),
                },
            },
        })),

    updateUpstreamServer: (id, data) =>
        set((state) => ({
            config: {
                ...state.config,
                upstream: {
                    ...state.config.upstream,
                    servers: state.config.upstream.servers.map((s) =>
                        s.id === id ? { ...s, ...data } : s
                    ),
                },
            },
        })),
}));
