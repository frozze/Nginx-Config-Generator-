// ─── Nginx Config Engine — Public API ────────────────────────────────────────
// Re-exports the full engine for use by frontend and backend.

export { generateNginxConfig } from './generator';
export { validateConfig } from './validator';
export { presetConfigs, presetMetas } from './presets';
export { sslPresets, getCiphersForPreset, getProtocolsForPreset } from './ssl-ciphers';

export type {
    NginxFullConfig,
    ServerConfig,
    SSLConfig,
    ProxyConfig,
    LocationConfig,
    RateLimitConfig,
    SecurityConfig,
    GzipConfig,
    PerformanceConfig,
    LoggingConfig,
    UpstreamServer,
    UpstreamConfig,
    ValidationWarning,
    GenerationResult,
} from './types';

export type { PresetMeta } from './presets';
export type { SSLPresetConfig } from './ssl-ciphers';
