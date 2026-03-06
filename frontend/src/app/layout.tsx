import type { Metadata } from "next";
import "./globals.css";
import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convex";
import { Toaster } from "@/components/ui/toaster";
import ConditionalLayout from "@/components/landing/ConditionalLayout";

// Force rebuild 2025-03-06 - All merge conflicts resolved

export const metadata: Metadata = {
    title: "EduMyles — School Management for East Africa",
    description:
        "Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.",
    other: {
        "msapplication-TileColor": "#056C40",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-sans antialiased">
                <ConvexProvider client={convexClient}>
                    <ConditionalLayout>{children}</ConditionalLayout>
                </ConvexProvider>
            </body>
        </html>
    );
}

