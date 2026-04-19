import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { WebVitalsReporter } from "@/components/providers/WebVitalsReporter";

export const metadata: Metadata = {
    title: {
        default: "EduMyles",
        template: "%s | EduMyles",
    },
    description:
        "Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.",
    icons: {
        icon: [
            { url: "/logo-icon.svg", type: "image/svg+xml" },
        ],
        apple: [
            { url: "/logo-icon.svg", type: "image/svg+xml" },
        ],
        shortcut: "/logo-icon.svg",
    },
    manifest: "/site.webmanifest",
    other: {
        // EduMyles 2026 brand primary — Forest Deep
        "msapplication-TileColor": "#061A12",
        "msapplication-TileImage": "/logo-icon.svg",
    },
};

/**
 * EduMyles Brand Guidelines 2026 — Typography System
 *
 * Plus Jakarta Sans → product dashboard UI (all panel body text & UI)
 * Playfair Display  → section headings, display text, pull quotes
 * DM Mono           → student IDs, codes, data tables, monospace data
 * Inter             → fallback for product UI
 *
 * Usage:
 *   font-sans    → Plus Jakarta Sans (default for all product UI)
 *   font-serif   → Playfair Display (headings, hero text)
 *   font-mono    → DM Mono (codes, IDs, tables)
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Runs synchronously before paint — prevents dark-mode flash */}
                <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('em-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();` }} />
            </head>
            {/*
             * font-sans  → Plus Jakarta Sans (brand UI font — all panels)
             * font-serif → Playfair Display (headings, display)
             * font-mono  → DM Mono (IDs, codes, data)
             * font-inter → Inter (legacy fallback)
             */}
            <body
                suppressHydrationWarning
                className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${dmMono.variable} ${inter.variable} font-sans antialiased`}
            >
                <ErrorBoundary>
                    <PostHogProvider>
                        <ConvexAuthProvider>
                            {children}
                        </ConvexAuthProvider>
                    </PostHogProvider>
                </ErrorBoundary>
                <WebVitalsReporter />
                <Toaster />
                <SpeedInsights />
            </body>
        </html>
    );
}
