// ─── Mozilla SSL Configuration Cipher Suites ────────────────────────────────
// Based on https://ssl-config.mozilla.org/
// Browser-compatible — no Node.js APIs.

export interface SSLPresetConfig {
    ciphers: string;
    protocols: string[];
    preferServerCiphers: boolean;
    dhParamRequired: boolean;
    minDhParamSize: number;
    sessionTimeout: string;
    sessionTickets: boolean;
}

/**
 * Modern configuration (TLS 1.3 only)
 * Recommended for services with modern clients (e.g., browsers, apps)
 * Oldest compatible clients: Firefox 63, Android 10, Chrome 70, Edge 75, Safari 12.1
 */
const modern: SSLPresetConfig = {
    ciphers: '', // TLS 1.3 cipher suites are not configurable in nginx
    protocols: ['TLSv1.3'],
    preferServerCiphers: false,
    dhParamRequired: false,
    minDhParamSize: 0,
    sessionTimeout: '1d',
    sessionTickets: false,
};

/**
 * Intermediate configuration (TLS 1.2 + TLS 1.3)
 * Recommended for general-purpose servers
 * Oldest compatible clients: Firefox 27, Android 4.4.2, Chrome 31, Edge, IE 11 on Win 7, Safari 9
 */
const intermediate: SSLPresetConfig = {
    ciphers: [
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'DHE-RSA-AES128-GCM-SHA256',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-CHACHA20-POLY1305',
    ].join(':'),
    protocols: ['TLSv1.2', 'TLSv1.3'],
    preferServerCiphers: false,
    dhParamRequired: true,
    minDhParamSize: 2048,
    sessionTimeout: '1d',
    sessionTickets: false,
};

/**
 * Legacy / Old configuration (TLS 1.0 + TLS 1.1 + TLS 1.2 + TLS 1.3)
 * For services that need to support very old clients
 * Oldest compatible clients: Firefox 1, Android 2.3, Chrome 1, IE 8, Safari 1
 */
const legacy: SSLPresetConfig = {
    ciphers: [
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'DHE-RSA-AES128-GCM-SHA256',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES128-SHA256',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-ECDSA-AES128-SHA',
        'ECDHE-RSA-AES128-SHA',
        'ECDHE-ECDSA-AES256-SHA384',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-ECDSA-AES256-SHA',
        'ECDHE-RSA-AES256-SHA',
        'DHE-RSA-AES128-SHA256',
        'DHE-RSA-AES256-SHA256',
        'AES128-GCM-SHA256',
        'AES256-GCM-SHA384',
        'AES128-SHA256',
        'AES256-SHA256',
        'AES128-SHA',
        'AES256-SHA',
        'DES-CBC3-SHA',
    ].join(':'),
    protocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    preferServerCiphers: true,
    dhParamRequired: true,
    minDhParamSize: 1024,
    sessionTimeout: '1d',
    sessionTickets: false,
};

export const sslPresets: Record<'modern' | 'intermediate' | 'legacy', SSLPresetConfig> = {
    modern,
    intermediate,
    legacy,
};

/**
 * Get the recommended cipher string for a preset.
 * For 'modern', nginx auto-selects TLS 1.3 ciphers — returns empty string.
 */
export function getCiphersForPreset(preset: 'modern' | 'intermediate' | 'legacy'): string {
    return sslPresets[preset].ciphers;
}

/**
 * Get the recommended protocols for a preset.
 */
export function getProtocolsForPreset(preset: 'modern' | 'intermediate' | 'legacy'): string[] {
    return sslPresets[preset].protocols;
}
