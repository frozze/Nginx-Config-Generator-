import Link from 'next/link';
import { Server, Heart } from 'lucide-react';
import AdSlot from '../ui/AdSlot';

export default function Footer() {
    return (
        <footer className="border-t border-dark-700/50 bg-dark-950 mt-24">
            <AdSlot position="footer" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-3">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                                <Server className="w-4 h-4" />
                            </div>
                            <span className="text-base font-bold text-dark-300">
                                Nginx<span className="text-accent-400">Config</span>
                            </span>
                        </Link>
                        <p className="text-sm text-dark-500 max-w-xs">
                            Free, open-source Nginx configuration generator. No signup, no tracking, everything runs in your browser.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 mb-3">Documentation</h3>
                        <ul className="space-y-2">
                            <li><Link href="/docs/reverse-proxy" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Reverse Proxy Guide</Link></li>
                            <li><Link href="/docs/ssl-setup" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">SSL/TLS Setup</Link></li>
                            <li><Link href="/docs/load-balancing" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Load Balancing</Link></li>
                            <li><Link href="/docs/security-headers" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Security Headers</Link></li>
                        </ul>
                    </div>

                    {/* More */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 mb-3">About</h3>
                        <ul className="space-y-2">
                            <li><Link href="/about" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">About</Link></li>
                            <li><Link href="https://github.com" target="_blank" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">GitHub</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-dark-500">
                    <p>&copy; {new Date().getFullYear()} NginxConfig Generator. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-err-400" /> for the dev community
                    </p>
                </div>
            </div>
        </footer>
    );
}
