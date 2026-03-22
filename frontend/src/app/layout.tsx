import type { Metadata } from "next";
import { Inter, Playfair_Display, DM_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
    title: "EduMyles - School Management for East Africa",
    description:
        "Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.",
    other: {
        // EduMyles 2026 brand primary — Forest Deep
        "msapplication-TileColor": "#061A12",
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
const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-plus-jakarta",
    display: "swap",
    preload: true,
});

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    style: ["normal", "italic"],
    variable: "--font-playfair",
    display: "swap",
    preload: false,
});

const dmMono = DM_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-dm-mono",
    display: "swap",
    preload: false,
});

const inter = Inter({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-inter",
    display: "swap",
    preload: true,
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
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
                className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${dmMono.variable} ${inter.variable} font-sans antialiased`}
            >
                <ErrorBoundary>
                    <ConvexAuthProvider>
                        {children}
                    </ConvexAuthProvider>
                </ErrorBoundary>
                <Toaster />
                <SpeedInsights />
            </body>
        </html>
    );
}
