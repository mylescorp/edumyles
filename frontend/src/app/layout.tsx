import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals-critical.css";
import LazyCSS from "@/components/LazyCSS";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { Toaster } from "@/components/ui/toaster";
import ConditionalLayout from "@/components/landing/ConditionalLayout";
import { ConvexClientProvider } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
    title: "EduMyles - School Management for East Africa",
    description:
        "Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.",
    other: {
        // EduMyles v3 brand primary — Dark Green
        "msapplication-TileColor": "#1A4731",
    },
};

/**
 * EduMyles Design System v3.0 — Typography
 *
 * Inter  → product dashboard UI (14px body, clean, highly legible)
 * Poppins → marketing / landing pages & H1 headings (bold, expressive)
 *
 * Usage:
 *   font-sans    → Inter (default for all product UI)
 *   font-poppins → Poppins (headings on marketing pages)
 */
const inter = Inter({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-inter",
    display: "swap",
    preload: true,
});

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-poppins",
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
            </head>
            {/*
             * font-sans resolves to Inter (product UI default).
             * Components that need Poppins can use className="font-poppins".
             */}
            <body
                className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
            >
                <ErrorBoundary>
                    <ConvexClientProvider>
                        <PerformanceMonitor />
                        <LazyCSS href="/globals.css" />
                        <ConditionalLayout>{children}</ConditionalLayout>
                    </ConvexClientProvider>
                </ErrorBoundary>
                <Toaster />
                <SpeedInsights />
            </body>
        </html>
    );
}
