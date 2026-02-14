// ─── Preset Configurations ───────────────────────────────────────────────────
// Each preset produces a working, deployable nginx config.
// Browser-compatible — no Node.js APIs.

import type { NginxConfig } from '../types';

export interface PresetMeta {
    id: string;
    name: string;
    description: string;
    config: NginxConfig;
}

// ── Shared defaults ──

const defaultSecurity = {
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
};

const defaultLogging = {
    accessLog: true,
    accessLogPath: '/var/log/nginx/access.log',
    errorLog: true,
    errorLogPath: '/var/log/nginx/error.log',
    errorLogLevel: 'error' as const,
    customLogFormat: false,
};

const defaultPerformance = {
    gzip: true,
    brotli: false,
    http2: false,
    clientMaxBodySize: 10,
    clientMaxBodyUnit: 'MB' as const,
    keepaliveTimeout: 65,
    workerConnections: 1024,
    staticCaching: false,
    cacheExpiry: '30d',
    gzipTypes: [
        'text/plain',
        'text/css',
        'application/json',
        'application/javascript',
        'text/xml',
        'application/xml',
        'application/xml+rss',
        'text/javascript',
        'image/svg+xml',
    ],
};

const defaultUpstream = {
    enabled: false,
    name: 'backend',
    servers: [],
    method: 'round-robin' as const,
};

const defaultSSL = {
    enabled: false,
    certificatePath: '/etc/ssl/cert.pem',
    keyPath: '/etc/ssl/key.pem',
    protocols: ['TLSv1.2', 'TLSv1.3'],
    preset: 'intermediate' as const,
    httpRedirect: false,
    enableHSTS: false,
    enableOCSP: false,
};

const defaultReverseProxy = {
    enabled: false,
    backendAddress: '',
    webSocket: false,
    realIpHeaders: true,
    customHeaders: [],
};

// ════════════════════════════════════════════════════════════════════════════
// Presets
// ════════════════════════════════════════════════════════════════════════════

const staticSite: NginxConfig = {
    serverName: 'example.com www.example.com',
    listenPort: 80,
    listen443: false,
    rootPath: '/var/www/html',
    indexFiles: ['index.html', 'index.htm'],
    ssl: defaultSSL,
    reverseProxy: defaultReverseProxy,
    locations: [
        {
            id: 'root',
            path: '/',
            matchType: 'prefix',
            type: 'static',
            root: '/var/www/html',
            tryFiles: '$uri $uri/ =404',
            index: '', autoindex: false,
            cacheExpiry: '', proxyPass: '', proxyWebSocket: false, proxyHeaders: [],
            redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        },
    ],
    security: defaultSecurity,
    performance: {
        ...defaultPerformance,
        staticCaching: true,
    },
    logging: defaultLogging,
    upstream: defaultUpstream,
};

const reverseProxy: NginxConfig = {
    serverName: 'app.example.com',
    listenPort: 443,
    listen443: true,
    rootPath: '',
    indexFiles: [],
    ssl: {
        ...defaultSSL,
        enabled: true,
        certificatePath: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/app.example.com/privkey.pem',
        httpRedirect: true,
        enableHSTS: true,
        enableOCSP: true,
    },
    reverseProxy: {
        enabled: true,
        backendAddress: 'http://127.0.0.1:3000',
        webSocket: true,
        realIpHeaders: true,
        customHeaders: [],
    },
    locations: [
        {
            id: 'root',
            path: '/',
            matchType: 'prefix',
            type: 'proxy',
            proxyPass: 'http://127.0.0.1:3000',
            proxyWebSocket: true,
            proxyHeaders: [
                { key: 'Upgrade', value: '$http_upgrade' },
                { key: 'Connection', value: 'upgrade' },
            ],
            root: '', tryFiles: '', index: '', autoindex: false,
            cacheExpiry: '', redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        },
    ],
    security: {
        ...defaultSecurity,
        securityHeaders: true,
    },
    performance: {
        ...defaultPerformance,
        http2: true,
        staticCaching: true,
    },
    logging: defaultLogging,
    upstream: defaultUpstream,
};

const wordpress: NginxConfig = {
    serverName: 'blog.example.com',
    listenPort: 443,
    listen443: true,
    rootPath: '/var/www/wordpress',
    indexFiles: ['index.php', 'index.html', 'index.htm'],
    ssl: {
        ...defaultSSL,
        enabled: true,
        certificatePath: '/etc/letsencrypt/live/blog.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/blog.example.com/privkey.pem',
        httpRedirect: true,
        enableHSTS: true,
        enableOCSP: true,
    },
    reverseProxy: defaultReverseProxy,
    locations: [
        {
            id: 'root',
            path: '/',
            matchType: 'prefix',
            type: 'static',
            root: '/var/www/wordpress',
            tryFiles: '$uri $uri/ /index.php?$args',
            index: '', autoindex: false,
            cacheExpiry: '', proxyPass: '', proxyWebSocket: false, proxyHeaders: [],
            redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        },
        {
            id: 'php',
            path: '\\.php$',
            matchType: 'regex',
            type: 'custom',
            customDirectives: [
                'fastcgi_pass unix:/var/run/php/php-fpm.sock;',
                'fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;',
                'include fastcgi_params;',
                'fastcgi_intercept_errors on;',
                'fastcgi_buffer_size 128k;',
                'fastcgi_buffers 4 256k;',
            ].join('\n'),
            root: '', tryFiles: '', index: '', autoindex: false,
            cacheExpiry: '', proxyPass: '', proxyWebSocket: false, proxyHeaders: [],
            redirectUrl: '', redirectCode: 301 as const
        },
        {
            id: 'ht',
            path: '/\\.ht',
            matchType: 'regex',
            type: 'custom',
            customDirectives: 'deny all;',
            root: '', tryFiles: '', index: '', autoindex: false,
            cacheExpiry: '', proxyPass: '', proxyWebSocket: false, proxyHeaders: [],
            redirectUrl: '', redirectCode: 301 as const
        },
    ],
    security: defaultSecurity,
    performance: {
        ...defaultPerformance,
        http2: true,
        clientMaxBodySize: 64,
        staticCaching: true,
    },
    logging: defaultLogging,
    upstream: defaultUpstream,
};

const spa: NginxConfig = {
    serverName: 'app.example.com',
    listenPort: 443,
    listen443: true,
    rootPath: '/var/www/app/dist',
    indexFiles: ['index.html'],
    ssl: {
        ...defaultSSL,
        enabled: true,
        certificatePath: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/app.example.com/privkey.pem',
        httpRedirect: true,
        enableHSTS: true,
        enableOCSP: true,
    },
    reverseProxy: defaultReverseProxy,
    locations: [
        {
            id: 'root',
            path: '/',
            matchType: 'prefix',
            type: 'static',
            root: '/var/www/app/dist',
            tryFiles: '$uri $uri/ /index.html',
            index: '', autoindex: false,
            cacheExpiry: '', proxyPass: '', proxyWebSocket: false, proxyHeaders: [],
            redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        },
        {
            id: 'api',
            path: '/api',
            matchType: 'prefix',
            type: 'proxy',
            proxyPass: 'http://127.0.0.1:3000',
            proxyWebSocket: false, proxyHeaders: [],
            root: '', tryFiles: '', index: '', autoindex: false,
            cacheExpiry: '', redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        },
    ],
    security: {
        ...defaultSecurity,
        // In simple model, securityHeaders is boolean.
        // If we want detailed CSP, we might need customDirectives in NginxConfig
        securityHeaders: true,
    },
    performance: {
        ...defaultPerformance,
        http2: true,
        staticCaching: true,
    },
    logging: defaultLogging,
    upstream: defaultUpstream,
};

const loadBalanced: NginxConfig = {
    serverName: 'api.example.com',
    listenPort: 443,
    listen443: true,
    rootPath: '',
    indexFiles: [],
    ssl: {
        ...defaultSSL,
        enabled: true,
        certificatePath: '/etc/letsencrypt/live/api.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/api.example.com/privkey.pem',
        httpRedirect: true,
        enableHSTS: true,
        enableOCSP: true,
    },
    // We don't have a top-level field for load balancer settings in simple config, 
    // but Upstream is supported
    reverseProxy: defaultReverseProxy,
    upstream: {
        enabled: true,
        name: 'api_backends',
        servers: [
            { id: 's1', address: '10.0.0.1:8080', weight: 3, maxFails: 3, failTimeout: 30 },
            { id: 's2', address: '10.0.0.2:8080', weight: 2, maxFails: 3, failTimeout: 30 },
            { id: 's3', address: '10.0.0.3:8080', weight: 1, maxFails: 3, failTimeout: 30 },
        ],
        method: 'least_conn' as const,
    },
    locations: [
        {
            id: 'root',
            path: '/',
            matchType: 'prefix',
            type: 'proxy',
            proxyPass: 'http://api_backends',
            proxyWebSocket: false, proxyHeaders: [],
            root: '', tryFiles: '', index: '', autoindex: false,
            cacheExpiry: '', redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        },
        {
            id: 'health',
            path: '/health',
            matchType: 'exact',
            type: 'proxy',
            proxyPass: 'http://api_backends',
            proxyWebSocket: false, proxyHeaders: [],
            root: '', tryFiles: '', index: '', autoindex: false,
            cacheExpiry: '', redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        },
    ],
    security: {
        ...defaultSecurity,
        rateLimiting: true,
        rateLimit: 10,
        rateBurst: 20,
    },
    performance: {
        ...defaultPerformance,
        http2: true,
    },
    logging: defaultLogging,
};

// ── Export all presets ──

export const presetConfigs: Record<string, NginxConfig> = {
    staticSite,
    reverseProxy,
    wordpress,
    spa,
    loadBalanced,
};

export const presetMetas: PresetMeta[] = [
    { id: 'staticSite', name: 'Simple Static Site', description: 'Basic static HTML/CSS file serving with caching and gzip', config: staticSite },
    { id: 'reverseProxy', name: 'Reverse Proxy', description: 'SSL-terminated proxy to a Node.js/Python/Go backend app', config: reverseProxy },
    { id: 'wordpress', name: 'WordPress', description: 'PHP-FPM + WordPress with rewrites, upload limits, and security', config: wordpress },
    { id: 'spa', name: 'SPA (React/Vue/Angular)', description: 'Single-page app with history fallback and API proxy', config: spa },
    { id: 'loadBalanced', name: 'Load Balanced API', description: 'Upstream load balancing with health checks and rate limiting', config: loadBalanced },
];
