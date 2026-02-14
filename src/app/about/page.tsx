
import type { Metadata } from 'next';
import { Server, Github, Globe } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About — Configen',
    description: 'Learn more about Configen, the free and open-source server configuration generator.',
};

export default function AboutPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/10 text-accent-400 mb-4">
                    <Server className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-dark-300">About Configen</h1>
                <p className="text-dark-400 mt-3 text-lg">
                    A free, open-source tool to generate production-ready Nginx configurations visually.
                </p>
            </div>

            <div className="space-y-8 text-dark-400 text-sm leading-relaxed">
                <section>
                    <h2 className="text-lg font-semibold text-dark-300 mb-3">Why we built this</h2>
                    <p>
                        Writing Nginx configs from scratch is tedious and error-prone. We built Configen
                        to make it easy for developers to create correct, secure, and optimized server configurations
                        without memorizing directive syntax.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-dark-300 mb-3">Privacy first</h2>
                    <p>
                        Everything runs 100% in your browser. No data is ever sent to any server.
                        We don&apos;t use analytics, we don&apos;t track you, and we don&apos;t store your configurations.
                        Your data is yours.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-dark-300 mb-3">Open source</h2>
                    <p>
                        This project is open source and free to use. Contributions are welcome!
                    </p>
                    <div className="mt-4 flex gap-3">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 text-sm hover:border-accent-500 transition-colors"
                        >
                            <Github className="w-4 h-4" /> View on GitHub
                        </a>
                    </div>
                </section>
            </div>

            <div className="mt-16 pt-8 border-t border-dark-700 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-all"
                >
                    <Globe className="w-4 h-4" /> Go to Generator
                </Link>
            </div>
        </div>
    );
}
