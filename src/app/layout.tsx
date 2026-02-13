import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'NginxConfig — Free Visual Nginx Configuration Generator',
    template: '%s | NginxConfig',
  },
  description: 'Generate production-ready Nginx configurations visually. Free, open-source, no signup. Configure reverse proxy, SSL, load balancing, security headers and more.',
  openGraph: {
    title: 'NginxConfig — Free Visual Nginx Configuration Generator',
    description: 'Build production-ready nginx.conf files through an interactive visual interface. 100% client-side, no data leaves your browser.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'NginxConfig',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NginxConfig Preview' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NginxConfig — Visual Nginx Config Generator',
    description: 'Free, open-source, runs in your browser. No signup required.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Nginx Config Generator",
              url: "https://nginxconfig.io",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0" },
              description:
                "Generate production-ready Nginx configurations visually. Free, open-source, no signup required.",
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
