// ─── Preset Validation Tests ─────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { generateNginxConfig } from '../src/lib/nginx/engine/generator';
import { validateConfig } from '../src/lib/nginx/engine/validator';
import { presetConfigs, presetMetas } from '../src/lib/nginx/engine/presets';

describe('Presets', () => {
    it('should have 5 presets defined', () => {
        expect(Object.keys(presetConfigs)).toHaveLength(5);
        expect(presetMetas).toHaveLength(5);
    });

    describe.each(Object.entries(presetConfigs))('Preset: %s', (name, config) => {
        it('should generate a valid non-empty config', () => {
            const result = generateNginxConfig(config);
            expect(result.config).toBeTruthy();
            expect(result.config.length).toBeGreaterThan(100);
        });

        it('should contain a server block', () => {
            const result = generateNginxConfig(config);
            expect(result.config).toContain('server {');
            expect(result.config).toContain('}');
        });

        it('should contain listen directive', () => {
            const result = generateNginxConfig(config);
            expect(result.config).toContain('listen ');
        });

        it('should pass validation with zero errors', () => {
            const warnings = validateConfig(config);
            const errors = warnings.filter((w) => w.severity === 'error');
            expect(errors, `Preset "${name}" has validation errors: ${JSON.stringify(errors)}`).toHaveLength(0);
        });

        it('should use 4-space indentation', () => {
            const result = generateNginxConfig(config);
            const indentedLines = result.config.split('\n').filter((l) => l.startsWith(' '));
            for (const line of indentedLines) {
                const leadingSpaces = line.match(/^( +)/)?.[1]?.length || 0;
                expect(leadingSpaces % 4, `Bad indentation in line: "${line}"`).toBe(0);
            }
        });

        it('should have a corresponding preset meta entry', () => {
            const meta = presetMetas.find((m) => m.id === name);
            expect(meta, `No meta entry for preset "${name}"`).toBeDefined();
            expect(meta!.name).toBeTruthy();
            expect(meta!.description).toBeTruthy();
        });
    });

    it('staticSite preset should not have SSL', () => {
        const result = generateNginxConfig(presetConfigs.staticSite);
        expect(result.config).not.toContain('ssl_certificate');
        expect(result.config).toContain('listen 80;');
    });

    it('reverseProxy preset should have SSL and redirect', () => {
        const result = generateNginxConfig(presetConfigs.reverseProxy);
        expect(result.config).toContain('ssl_certificate');
        expect(result.config).toContain('return 301 https://');
        expect(result.config).toContain('proxy_pass');
    });

    it('wordpress preset should have PHP-FPM config', () => {
        const result = generateNginxConfig(presetConfigs.wordpress);
        expect(result.config).toContain('fastcgi_pass');
        expect(result.config).toContain('fastcgi_param');
    });

    it('spa preset should have try_files fallback to index.html', () => {
        const result = generateNginxConfig(presetConfigs.spa);
        expect(result.config).toContain('try_files $uri $uri/ /index.html;');
    });

    it('loadBalanced preset should have upstream block', () => {
        const result = generateNginxConfig(presetConfigs.loadBalanced);
        expect(result.config).toContain('upstream api_backends');
        expect(result.config).toContain('least_conn');
        expect(result.config).toContain('proxy_pass http://api_backends');
    });
});
