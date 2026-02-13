// ─── Preset Configurations ───────────────────────────────────────────────────
// Each preset produces a working, deployable nginx config.
// Browser-compatible — no Node.js APIs.

import type { NginxFullConfig } from './types';

export interface PresetMeta {
    id: string;
    name: string;
    description: string;
    config: NginxFullConfig;
}

// ── Shared defaults ──

const defaultSecurity = {
    serverTokens: false,
    securityHeaders: {
        xFrameOptions: 'SAMEORIGIN' as const,
        xContentTypeOptions: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
    },
};

const defaultLogging = {
    accessLog: { enabled: true, path: '/var/log/nginx/access.log' },
    errorLog: { enabled: true, path: '/var/log/nginx/error.log', level: 'error' as const },
};

const defaultGzip = {
    enabled: true,
    compLevel: 6,
    minLength: 256,
    types: [
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

// ════════════════════════════════════════════════════════════════════════════
// Presets
// ════════════════════════════════════════════════════════════════════════════

const staticSite: NginxFullConfig = {
    server: {
        serverName: ['example.com', 'www.example.com'],
        listenPort: 80,
        listenIPv6: true,
        root: '/var/www/html',
        index: ['index.html', 'index.htm'],
    },
    locations: [
        {
            path: '/',
            matchType: 'prefix',
            type: 'static',
            static: {
                root: '/var/www/html',
                tryFiles: '$uri $uri/ =404',
            },
        },
    ],
    security: defaultSecurity,
    performance: {
        gzip: defaultGzip,
        http2: false,
        clientMaxBodySize: '10M',
        keepaliveTimeout: 65,
        sendfile: true,
        tcpNopush: true,
        tcpNodelay: true,
        staticCaching: {
            images: '30d',
            css: '7d',
            js: '7d',
            fonts: '30d',
        },
    },
    logging: defaultLogging,
};

const reverseProxy: NginxFullConfig = {
    server: {
        serverName: ['app.example.com'],
        listenPort: 443,
        listenIPv6: true,
    },
    ssl: {
        enabled: true,
        certPath: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/app.example.com/privkey.pem',
        protocols: ['TLSv1.2', 'TLSv1.3'],
        preset: 'intermediate',
        httpRedirect: true,
        hsts: true,
        hstsMaxAge: 63072000,
        ocspStapling: true,
    },
    locations: [
        {
            path: '/',
            matchType: 'prefix',
            type: 'proxy',
            proxy: {
                backendAddress: 'http://127.0.0.1:3000',
                websocket: true,
                passRealIP: true,
                customHeaders: {},
                proxyReadTimeout: 60,
            },
        },
    ],
    security: defaultSecurity,
    performance: {
        gzip: defaultGzip,
        http2: true,
        clientMaxBodySize: '10M',
        keepaliveTimeout: 65,
        sendfile: true,
        tcpNopush: true,
        tcpNodelay: true,
    },
    logging: defaultLogging,
};

const wordpress: NginxFullConfig = {
    server: {
        serverName: ['blog.example.com'],
        listenPort: 443,
        listenIPv6: true,
        root: '/var/www/wordpress',
        index: ['index.php', 'index.html', 'index.htm'],
    },
    ssl: {
        enabled: true,
        certPath: '/etc/letsencrypt/live/blog.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/blog.example.com/privkey.pem',
        protocols: ['TLSv1.2', 'TLSv1.3'],
        preset: 'intermediate',
        httpRedirect: true,
        hsts: true,
        hstsMaxAge: 63072000,
        ocspStapling: true,
    },
    locations: [
        {
            path: '/',
            matchType: 'prefix',
            type: 'static',
            static: {
                root: '/var/www/wordpress',
                tryFiles: '$uri $uri/ /index.php?$args',
            },
        },
        {
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
        },
        {
            path: '/\\.ht',
            matchType: 'regex',
            type: 'custom',
            customDirectives: 'deny all;',
        },
        {
            path: '/wp-content/uploads/',
            matchType: 'prefix',
            type: 'static',
            static: {
                root: '/var/www/wordpress',
                expires: '30d',
            },
        },
    ],
    security: {
        ...defaultSecurity,
        securityHeaders: {
            ...defaultSecurity.securityHeaders,
            xFrameOptions: 'SAMEORIGIN',
        },
    },
    performance: {
        gzip: defaultGzip,
        http2: true,
        clientMaxBodySize: '64M',
        keepaliveTimeout: 65,
        sendfile: true,
        tcpNopush: true,
        tcpNodelay: true,
        staticCaching: {
            images: '30d',
            css: '7d',
            js: '7d',
            fonts: '30d',
        },
    },
    logging: defaultLogging,
};

const spa: NginxFullConfig = {
    server: {
        serverName: ['app.example.com'],
        listenPort: 443,
        listenIPv6: true,
        root: '/var/www/app/dist',
        index: ['index.html'],
    },
    ssl: {
        enabled: true,
        certPath: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/app.example.com/privkey.pem',
        protocols: ['TLSv1.2', 'TLSv1.3'],
        preset: 'intermediate',
        httpRedirect: true,
        hsts: true,
        hstsMaxAge: 63072000,
        ocspStapling: true,
    },
    locations: [
        {
            path: '/',
            matchType: 'prefix',
            type: 'static',
            static: {
                root: '/var/www/app/dist',
                tryFiles: '$uri $uri/ /index.html',
            },
        },
        {
            path: '/api',
            matchType: 'prefix',
            type: 'proxy',
            proxy: {
                backendAddress: 'http://127.0.0.1:3000',
                websocket: false,
                passRealIP: true,
                customHeaders: {},
            },
        },
    ],
    security: {
        ...defaultSecurity,
        securityHeaders: {
            ...defaultSecurity.securityHeaders,
            contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        },
    },
    performance: {
        gzip: defaultGzip,
        http2: true,
        clientMaxBodySize: '10M',
        keepaliveTimeout: 65,
        sendfile: true,
        tcpNopush: true,
        tcpNodelay: true,
        staticCaching: {
            images: '30d',
            css: '7d',
            js: '7d',
            fonts: '30d',
        },
    },
    logging: defaultLogging,
};

const loadBalanced: NginxFullConfig = {
    server: {
        serverName: ['api.example.com'],
        listenPort: 443,
        listenIPv6: true,
    },
    ssl: {
        enabled: true,
        certPath: '/etc/letsencrypt/live/api.example.com/fullchain.pem',
        keyPath: '/etc/letsencrypt/live/api.example.com/privkey.pem',
        protocols: ['TLSv1.2', 'TLSv1.3'],
        preset: 'intermediate',
        httpRedirect: true,
        hsts: true,
        hstsMaxAge: 63072000,
        ocspStapling: true,
    },
    upstream: {
        name: 'api_backends',
        servers: [
            { address: '10.0.0.1:8080', weight: 3, maxFails: 3, failTimeout: '30s' },
            { address: '10.0.0.2:8080', weight: 2, maxFails: 3, failTimeout: '30s' },
            { address: '10.0.0.3:8080', weight: 1, maxFails: 3, failTimeout: '30s', backup: true },
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
                backendAddress: 'http://api_backends',
                websocket: false,
                passRealIP: true,
                customHeaders: {},
                proxyConnectTimeout: 10,
                proxyReadTimeout: 60,
                proxySendTimeout: 60,
            },
        },
        {
            path: '/health',
            matchType: 'exact',
            type: 'proxy',
            proxy: {
                backendAddress: 'http://api_backends',
                websocket: false,
                passRealIP: false,
                customHeaders: {},
            },
        },
    ],
    security: {
        ...defaultSecurity,
        rateLimit: {
            enabled: true,
            zone: '$binary_remote_addr zone=req_limit:10m rate=10r/s',
            requests: 10,
            burst: 20,
            nodelay: true,
        },
    },
    performance: {
        gzip: {
            enabled: true,
            compLevel: 6,
            minLength: 256,
            types: ['application/json', 'text/plain'],
        },
        http2: true,
        clientMaxBodySize: '10M',
        keepaliveTimeout: 65,
        sendfile: true,
        tcpNopush: true,
        tcpNodelay: true,
    },
    logging: defaultLogging,
};

// ── Export all presets ──

export const presetConfigs: Record<string, NginxFullConfig> = {
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
