// ─── Nginx Config Validator ──────────────────────────────────────────────────
// Browser-compatible — no Node.js APIs.

import type { NginxConfig, ValidationWarning } from '../types';

const DOMAIN_REGEX = /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

function warn(field: string, message: string): ValidationWarning {
    return { field, message, severity: 'warning' };
}

function error(field: string, message: string): ValidationWarning {
    return { field, message, severity: 'error' };
}



/**
 * Validates an NginxConfig and returns an array of warnings/errors.
 * Does NOT prevent generation — just reports potential issues.
 */
export function validateConfig(input: NginxConfig): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // ── Server validation ──
    const serverName = input.serverName.trim();
    if (!serverName) {
        warnings.push(warn('serverName', 'No server name defined. Nginx will use the default server.'));
    } else {
        const names = serverName.split(/\s+/);
        for (const name of names) {
            if (name !== '_' && name !== 'localhost' && !DOMAIN_REGEX.test(name) && !IP_REGEX.test(name)) {
                warnings.push(warn('serverName', `"${name}" doesn't look like a valid domain or IP.`));
            }
        }
    }

    if (input.listenPort < 1 || input.listenPort > 65535) {
        warnings.push(error('listenPort', `Port ${input.listenPort} is out of valid range (1-65535).`));
    }

    // ── SSL validation ──
    if (input.ssl.enabled) {
        if (!input.ssl.certificatePath || !input.ssl.certificatePath.startsWith('/')) {
            warnings.push(warn('ssl.certificatePath', 'SSL is enabled but certificate path is missing or not an absolute path.'));
        }
        if (!input.ssl.keyPath || !input.ssl.keyPath.startsWith('/')) {
            warnings.push(warn('ssl.keyPath', 'SSL is enabled but private key path is missing or not an absolute path.'));
        }
        if (input.ssl.enableHSTS) {
            // HSTS max age check omitted as it's not in basic types or we default it
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
        if (loc.type === 'proxy') {
            if (!loc.proxyPass) {
                warnings.push(error('locations.proxy', `Location "${loc.path}" is a proxy but has no proxyPass address.`));
            }
        }

        // Redirect location validation
        if (loc.type === 'redirect') {
            if (!loc.redirectUrl) {
                warnings.push(error('locations.redirect', `Location "${loc.path}" is a redirect but has no target URL.`));
            }
        }
    }

    // ── Upstream validation ──
    if (input.upstream.enabled) {
        if (input.upstream.servers.length === 0) {
            warnings.push(warn('upstream', `Upstream "${input.upstream.name}" has no servers defined.`));
        }
        for (const srv of input.upstream.servers) {
            if (!srv.address || !srv.address.trim()) {
                warnings.push(error('upstream.servers', 'An upstream server has an empty address.'));
            }
        }
    }

    return warnings;
}
