import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ConditionalLayout from "@/components/landing/ConditionalLayout";
import { ConvexClientProvider } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Force rebuild 2025-03-06 - All merge conflicts resolved

export const metadata: Metadata = {
    title: "EduMyles - School Management for East Africa",
    description:
        "Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.",
    other: {
        "msapplication-TileColor": "#056C40",
    },
};

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-poppins",
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${poppins.variable} font-sans antialiased`}>
                <ErrorBoundary>
                    <ConvexClientProvider>
                        <ConditionalLayout>{children}</ConditionalLayout>
                    </ConvexClientProvider>
                </ErrorBoundary>
                <Toaster />
                <SpeedInsights />
            </body>
        </html>
    );
}


