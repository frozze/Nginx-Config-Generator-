// ─── Nginx Config Validator ──────────────────────────────────────────────────
// Browser-compatible — no Node.js APIs.

import type { NginxFullConfig, ValidationWarning } from './types';

const DOMAIN_REGEX = /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const URL_REGEX = /^https?:\/\/.+/;

function warn(field: string, message: string): ValidationWarning {
    return { field, message, severity: 'warning' };
}

function error(field: string, message: string): ValidationWarning {
    return { field, message, severity: 'error' };
}

function info(field: string, message: string): ValidationWarning {
    return { field, message, severity: 'info' };
}

/**
 * Validates an NginxFullConfig and returns an array of warnings/errors.
 * Does NOT prevent generation — just reports potential issues.
 */
export function validateConfig(input: NginxFullConfig): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // ── Server validation ──
    if (input.server.serverName.length === 0) {
        warnings.push(warn('server.serverName', 'No server names defined. Nginx will use the default server.'));
    } else {
        for (const name of input.server.serverName) {
            const trimmed = name.trim();
            if (!trimmed) {
                warnings.push(warn('server.serverName', 'Empty server name detected.'));
            } else if (trimmed !== '_' && trimmed !== 'localhost' && !DOMAIN_REGEX.test(trimmed) && !IP_REGEX.test(trimmed)) {
                warnings.push(warn('server.serverName', `"${trimmed}" doesn't look like a valid domain or IP.`));
            }
        }
    }

    if (input.server.listenPort < 1 || input.server.listenPort > 65535) {
        warnings.push(error('server.listenPort', `Port ${input.server.listenPort} is out of valid range (1-65535).`));
    }

    // ── SSL validation ──
    if (input.ssl?.enabled) {
        if (!input.ssl.certPath || !input.ssl.certPath.startsWith('/')) {
            warnings.push(warn('ssl.certPath', 'SSL is enabled but certificate path is missing or not an absolute path.'));
        }
        if (!input.ssl.keyPath || !input.ssl.keyPath.startsWith('/')) {
            warnings.push(warn('ssl.keyPath', 'SSL is enabled but private key path is missing or not an absolute path.'));
        }
        if (input.ssl.hsts) {
            const maxAge = input.ssl.hstsMaxAge ?? 63072000;
            if (maxAge < 86400) {
                warnings.push(warn('ssl.hstsMaxAge', `HSTS max-age of ${maxAge}s is very short (less than 1 day). Consider at least 6 months.`));
            }
        }
        if (input.ssl.preset !== 'modern' && !input.ssl.dhParamPath) {
            warnings.push(info('ssl.dhParamPath', `DH parameters recommended for "${input.ssl.preset}" SSL preset.`));
        }
    }

    // ── Location validation ──
    const locationPaths = new Set<string>();
    for (const loc of input.locations) {
        if (!loc.path || !loc.path.trim()) {
            warnings.push(error('locations', 'A location block has an empty path.'));
        }

        const pathKey = `${loc.matchType}:${loc.path}`;
        if (locationPaths.has(pathKey)) {
            warnings.push(error('locations', `Duplicate location path: "${loc.path}" with match type "${loc.matchType}".`));
        }
        locationPaths.add(pathKey);

        // Proxy location validation
        if (loc.type === 'proxy' && loc.proxy) {
            if (!loc.proxy.backendAddress) {
                warnings.push(error('locations.proxy', `Location "${loc.path}" is a proxy but has no backend address.`));
            } else if (!URL_REGEX.test(loc.proxy.backendAddress) && !loc.proxy.backendAddress.startsWith('http://')) {
                // Allow upstream references like http://backend_name
                if (!loc.proxy.backendAddress.match(/^https?:\/\/[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                    warnings.push(warn('locations.proxy', `Backend address "${loc.proxy.backendAddress}" for "${loc.path}" may not be a valid URL.`));
                }
            }
        }

        // Redirect location validation
        if (loc.type === 'redirect' && loc.redirect) {
            if (!loc.redirect.target) {
                warnings.push(error('locations.redirect', `Location "${loc.path}" is a redirect but has no target.`));
            }
        }

        // Static + proxy conflict
        if (loc.type === 'proxy' && loc.static?.root) {
            warnings.push(error('locations', `Location "${loc.path}" has both proxy and static root configured — pick one.`));
        }
    }

    // Default location fallback check
    if (input.locations.length === 0) {
        warnings.push(info('locations', 'No locations defined. A default location / will be generated.'));
    }

    // ── Upstream validation ──
    if (input.upstream) {
        if (input.upstream.servers.length === 0) {
            warnings.push(warn('upstream', `Upstream "${input.upstream.name}" has no servers defined.`));
        }
        for (const srv of input.upstream.servers) {
            if (!srv.address || !srv.address.trim()) {
                warnings.push(error('upstream.servers', 'An upstream server has an empty address.'));
            }
        }

        // Check if upstream is referenced in any proxy_pass
        const upstreamRef = `http://${input.upstream.name}`;
        const isReferenced = input.locations.some(
            (loc) => loc.type === 'proxy' && loc.proxy?.backendAddress?.startsWith(upstreamRef)
        );
        if (!isReferenced) {
            warnings.push(warn('upstream', `Upstream "${input.upstream.name}" is defined but not referenced in any proxy_pass.`));
        }
    }

    // ── Performance validation ──
    if (input.performance.gzip) {
        const level = input.performance.gzip.compLevel;
        if (level < 1 || level > 9) {
            warnings.push(error('performance.gzip.compLevel', `Gzip compression level ${level} is out of range (1-9).`));
        }
    }

    // Parse client max body size
    const bodySize = input.performance.clientMaxBodySize;
    const match = bodySize.match(/^(\d+)([kmgKMG]?)$/);
    if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toUpperCase();
        const bytes = unit === 'G' ? value * 1073741824 : unit === 'M' ? value * 1048576 : unit === 'K' ? value * 1024 : value;
        if (bytes > 1073741824) {
            warnings.push(warn('performance.clientMaxBodySize', `Client max body size of ${bodySize} is over 1GB. Is this intentional?`));
        }
    }

    // ── Security rate limit ──
    if (input.security.rateLimit?.enabled && !input.security.rateLimit.zone) {
        warnings.push(info('security.rateLimit', 'Rate limiting enabled but no zone defined — one will be auto-generated.'));
    }

    // ── HTTP/2 without SSL ──
    if (input.performance.http2 && (!input.ssl || !input.ssl.enabled)) {
        warnings.push(warn('performance.http2', 'HTTP/2 typically requires SSL to be enabled.'));
    }

    return warnings;
}
