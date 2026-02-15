'use client';

import { affiliateProviders, trackAffiliateClick } from '@/lib/affiliates';
import { ExternalLink, Server } from 'lucide-react';

export default function DeploySection() {
    return (
        <section className="mt-8 mb-6">
            <div className="rounded-2xl border border-dark-700 bg-surface-raised p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                        <Server className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-dark-300">Deploy this config</h3>
                </div>
                <p className="text-sm text-dark-400 mb-4">
                    Get a server and deploy your configuration in minutes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {affiliateProviders.map((provider) => (
                        <a
                            key={provider.slug}
                            href={provider.url}
                            target="_blank"
                            rel="sponsored noopener"
                            onClick={() => trackAffiliateClick(provider.slug)}
                            className={`group flex flex-col gap-2 p-3 rounded-xl border border-dark-700 bg-dark-900/50 hover:bg-dark-800 hover:border-dark-600 transition-all ${(provider.image || provider.imageLight) ? 'items-center justify-center p-0 overflow-hidden border-none bg-transparent hover:bg-transparent' : ''
                                }`}
                        >
                            {provider.imageLight && provider.imageDark ? (
                                // Theme-aware badges (e.g. Vultr)
                                <>
                                    <img
                                        src={provider.imageLight}
                                        alt={`${provider.name} Referral Badge`}
                                        className="w-full h-auto max-h-[50px] object-contain dark:hidden"
                                    />
                                    <img
                                        src={provider.imageDark}
                                        alt={`${provider.name} Referral Badge`}
                                        className="w-full h-auto max-h-[50px] object-contain hidden dark:block"
                                    />
                                </>
                            ) : provider.image ? (
                                // Single Badge image (e.g. DigitalOcean)
                                <img
                                    src={provider.image}
                                    alt={`${provider.name} Referral Badge`}
                                    className="w-full h-auto max-h-[50px] object-contain"
                                />
                            ) : (
                                // Standard card
                                <>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-semibold text-sm text-dark-300 group-hover:text-white transition-colors">
                                            {provider.name}
                                        </span>
                                        <ExternalLink className="w-3.5 h-3.5 text-dark-500 group-hover:text-accent-400 transition-colors" />
                                    </div>
                                    <span className="text-xs text-dark-500 w-full">{provider.tagline}</span>
                                    <span
                                        className="text-xs font-medium mt-auto w-full"
                                        style={{ color: provider.color }}
                                    >
                                        {provider.credit}
                                    </span>
                                </>
                            )}
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
