// ─── Config Validation / Warnings ──────────────────────────────────────────
import type { NginxConfig, ConfigWarning } from './types';

export function validateConfig(config: NginxConfig): ConfigWarning[] {
    const warnings: ConfigWarning[] = [];

    // SSL enabled but no cert paths
    if (config.ssl.enabled) {
        if (!config.ssl.certificatePath) {
            warnings.push({ section: 'SSL', message: 'SSL is enabled but no certificate path is specified.' });
        }
        if (!config.ssl.keyPath) {
            warnings.push({ section: 'SSL', message: 'SSL is enabled but no key path is specified.' });
        }
    }

    // Server name empty
    if (!config.serverName.trim()) {
        warnings.push({ section: 'Basic', message: 'Server name is empty. Consider setting a domain name.' });
    }

    // Reverse proxy with no backend
    if (config.reverseProxy.enabled && !config.reverseProxy.backendAddress) {
        warnings.push({ section: 'Reverse Proxy', message: 'Reverse proxy is enabled but no backend address is set.' });
    }

    // Locations with empty path
    for (const loc of config.locations) {
        if (!loc.path.trim()) {
            warnings.push({ section: 'Locations', message: `A location block has an empty path.` });
        }
        if (loc.type === 'proxy' && !loc.proxyPass) {
            warnings.push({ section: 'Locations', message: `Location "${loc.path}" is a proxy but has no proxy_pass URL.` });
        }
        if (loc.type === 'redirect' && !loc.redirectUrl) {
            warnings.push({ section: 'Locations', message: `Location "${loc.path}" is a redirect but has no target URL.` });
        }
    }

    // Upstream enabled but empty
    if (config.upstream.enabled && config.upstream.servers.length === 0) {
        warnings.push({ section: 'Load Balancing', message: 'Load balancing is enabled but no backend servers are defined.' });
    }

    // Basic auth with no file
    if (config.security.basicAuth && !config.security.basicAuthFile) {
        warnings.push({ section: 'Security', message: 'Basic auth is enabled but no password file path is set.' });
    }

    // HTTP/2 without SSL
    if (config.performance.http2 && !config.ssl.enabled) {
        warnings.push({ section: 'Performance', message: 'HTTP/2 typically requires SSL to be enabled.' });
    }

    return warnings;
}
