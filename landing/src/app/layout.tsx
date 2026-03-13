import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Mylesoft Technologies — AI-Powered Software Solutions for East Africa",
  description:
    "Transforming businesses across East Africa with innovative software solutions for education, healthcare, agriculture, and more. 20+ AI-powered products built for African markets.",
  other: {
    "msapplication-TileColor": "#1A395B",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A395B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
