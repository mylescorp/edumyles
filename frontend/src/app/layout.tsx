import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { WebVitalsReporter } from "@/components/providers/WebVitalsReporter";
import { ThemeProvider } from "@/hooks/useTheme";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});



const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://app.edumyles.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "EduMyles",
    template: "%s | EduMyles",
  },
  description:
    "Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.",
  alternates: {
    canonical: "./",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon-light.png",
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.png",
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  other: {
    "msapplication-TileColor": "#FAFAFA",
    "msapplication-TileImage": "/favicon-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-density="comfortable" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement,t;try{var m=document.cookie.match(/(?:^|;\\s*)em-theme=(light|dark|system)(?:;|$)/);t=m&&m[1]||localStorage.getItem('em-theme');if(t!=='light'&&t!=='dark'&&t!=='system')t='system';var d=t==='dark'||t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches;r.classList.toggle('dark',d);r.setAttribute('data-theme',d?'dark':'light')}catch(e){r.setAttribute('data-theme','light')}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <ErrorBoundary>
            <PostHogProvider>
              <ConvexAuthProvider>{children}</ConvexAuthProvider>
            </PostHogProvider>
          </ErrorBoundary>
        </ThemeProvider>
        <WebVitalsReporter />
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
