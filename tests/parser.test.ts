import { describe, test, expect } from 'vitest';
import { parseNginxConfig, tokenize } from '../src/lib/nginx/parser';
import { generateNginxConfig } from '../src/lib/nginx/engine/generator';
import { createDefaultConfig } from '../src/stores/configStore';

describe('Nginx Config Parser', () => {
    test('tokenizes basic directive', () => {
        const input = 'listen 80;';
        const tokens = tokenize(input);
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: 'directive', value: 'listen', line: 1 });
        expect(tokens[1]).toEqual({ type: 'directive', value: '80', line: 1 });
        expect(tokens[2]).toEqual({ type: 'semicolon', line: 1 });
    });

    test('parses minimal server block', () => {
        const input = `
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
}`;
        const result = parseNginxConfig(input);
        expect(result.config.listenPort).toBe(80);
        expect(result.config.serverName).toBe('example.com');
        expect(result.config.rootPath).toBe('/var/www/html');
    });

    test('detects SSL and HTTP2', () => {
        const input = `
server {
    listen 443 ssl http2;
    ssl_certificate /path/cert.pem;
    ssl_certificate_key /path/key.pem;
}`;
        const result = parseNginxConfig(input);
        expect(result.config.ssl.enabled).toBe(true);
        expect(result.config.listen443).toBe(true);
        expect(result.config.performance.http2).toBe(true);
        expect(result.config.ssl.certificatePath).toBe('/path/cert.pem');
    });

    test('parses gzip settings', () => {
        const input = `
server {
    gzip on;
    gzip_types text/plain application/json;
    client_max_body_size 10M;
}`;
        const result = parseNginxConfig(input);
        expect(result.config.performance.gzip).toBe(true);
        expect(result.config.performance.gzipTypes).toContain('application/json');
        expect(result.config.performance.clientMaxBodySize).toBe(10);
        expect(result.config.performance.clientMaxBodyUnit).toBe('MB');
    });

    test('parses upstream block', () => {
        const input = `
upstream backend {
    least_conn;
    server 127.0.0.1:3000 weight=3;
    server 10.0.0.1;
}
server {
    location / {
        proxy_pass http://backend;
    }
}`;
        const result = parseNginxConfig(input);
        expect(result.config.upstream.enabled).toBe(true);
        expect(result.config.upstream.name).toBe('backend');
        expect(result.config.upstream.method).toBe('least_conn');
        expect(result.config.upstream.servers).toHaveLength(2);
        expect(result.config.upstream.servers[0].weight).toBe(3);
    });

    test('parses location blocks', () => {
        const input = `
server {
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Upgrade $http_upgrade;
    }
    location = /404.html {
        root /usr/share/nginx/html;
    }
}`;
        const result = parseNginxConfig(input);
        expect(result.config.locations).toHaveLength(2);

        const loc1 = result.config.locations[0];
        expect(loc1.path).toBe('/api');
        expect(loc1.type).toBe('proxy');
        expect(loc1.proxyWebSocket).toBe(true);

        const loc2 = result.config.locations[1];
        expect(loc2.matchType).toBe('exact');
        expect(loc2.root).toBe('/usr/share/nginx/html');
    });

    test('does not import generated static-caching locations as user locations', () => {
        const config = createDefaultConfig();
        config.performance.staticCaching = true;

        const generated = generateNginxConfig(config).config;
        const parsed = parseNginxConfig(generated).config;

        expect(parsed.performance.staticCaching).toBe(true);
        expect(parsed.locations.some((loc) => loc.path.includes('jpg|jpeg|png|gif|ico|svg|webp'))).toBe(false);
        expect(parsed.locations.some((loc) => loc.path.includes('css|js|woff2|woff|ttf'))).toBe(false);
    });
});
