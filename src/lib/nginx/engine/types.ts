// ─── Nginx Configuration Type Definitions ───────────────────────────────────
// Full-featured types for the backend engine.
// Browser-compatible — no Node.js-specific APIs.

export interface ServerConfig {
    serverName: string[];
    listenPort: number;
    listenIPv6: boolean;
    root?: string;
    index?: string[];
}

export interface SSLConfig {
    enabled: boolean;
    certPath: string;
    keyPath: string;
    protocols: ('TLSv1.2' | 'TLSv1.3')[];
    ciphers?: string;
    preset: 'modern' | 'intermediate' | 'legacy';
    httpRedirect: boolean;
    hsts: boolean;
    hstsMaxAge?: number;
    ocspStapling: boolean;
    dhParamPath?: string;
}

export interface ProxyConfig {
    backendAddress: string;
    websocket: boolean;
    passRealIP: boolean;
    customHeaders: Record<string, string>;
    proxyConnectTimeout?: number;
    proxyReadTimeout?: number;
    proxySendTimeout?: number;
    proxyBuffering?: boolean;
}

export interface LocationConfig {
    path: string;
    matchType: 'prefix' | 'exact' | 'regex' | 'regex_case_insensitive';
    type: 'static' | 'proxy' | 'redirect' | 'custom';
    static?: {
        root: string;
        tryFiles?: string;
        autoindex?: boolean;
        expires?: string;
    };
    proxy?: ProxyConfig;
    redirect?: {
        target: string;
        code: 301 | 302;
    };
    customDirectives?: string;
}

export interface RateLimitConfig {
    enabled: boolean;
    zone: string;
    requests: number;
    burst: number;
    nodelay: boolean;
}

export interface SecurityConfig {
    serverTokens: boolean;
    securityHeaders: {
        xFrameOptions?: 'DENY' | 'SAMEORIGIN';
        xContentTypeOptions: boolean;
        referrerPolicy?: string;
        contentSecurityPolicy?: string;
        permissionsPolicy?: string;
    };
    rateLimit?: RateLimitConfig;
    ipAllowlist?: string[];
    ipDenylist?: string[];
    basicAuth?: {
        realm: string;
        htpasswdPath: string;
    };
}

export interface GzipConfig {
    enabled: boolean;
    compLevel: number;
    minLength: number;
    types: string[];
}

export interface PerformanceConfig {
    gzip?: GzipConfig;
    brotli?: boolean;
    http2: boolean;
    clientMaxBodySize: string;
    keepaliveTimeout: number;
    workerConnections?: number;
    staticCaching?: {
        images: string;
        css: string;
        js: string;
        fonts: string;
    };
    sendfile: boolean;
    tcpNopush: boolean;
    tcpNodelay: boolean;
}

export interface LoggingConfig {
    accessLog: {
        enabled: boolean;
        path: string;
        format?: string;
    };
    errorLog: {
        enabled: boolean;
        path: string;
        level: 'debug' | 'info' | 'notice' | 'warn' | 'error' | 'crit';
    };
}

export interface UpstreamServer {
    address: string;
    weight?: number;
    maxFails?: number;
    failTimeout?: string;
    backup?: boolean;
    down?: boolean;
}

export interface UpstreamConfig {
    name: string;
    servers: UpstreamServer[];
    method: 'round_robin' | 'least_conn' | 'ip_hash' | 'random';
    keepalive?: number;
}

export interface NginxFullConfig {
    server: ServerConfig;
    ssl?: SSLConfig;
    locations: LocationConfig[];
    security: SecurityConfig;
    performance: PerformanceConfig;
    logging: LoggingConfig;
    upstream?: UpstreamConfig;
}

export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'warning' | 'error' | 'info';
}

export interface GenerationResult {
    config: string;
    warnings: ValidationWarning[];
}
