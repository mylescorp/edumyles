import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ConditionalLayout from "@/components/ConditionalLayout";
import AttributionTracker from "@/components/ui/AttributionTracker";
import PerformanceTracker from "@/components/ui/PerformanceTracker";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "School Management System for African Schools | EduMyles",
    template: "%s | EduMyles",
  },
  description:
    "EduMyles is the all-in-one school management system for East African schools. M-Pesa fee collection, CBC gradebook, parent portal, attendance tracking, and more. Trusted by schools across Kenya, Uganda, Tanzania, Rwanda, and Zambia.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "EduMyles — School Management System for East Africa",
    description:
      "The all-in-one school management platform for East African schools. M-Pesa fees, digital gradebooks, parent communication & more.",
    url: SITE_URL,
    siteName: "EduMyles",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduMyles — School Management System for East Africa",
    description: "The all-in-one school management platform for East African schools.",
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/brand/favicon-192.png",
  },
  robots: { index: true, follow: true },
  keywords: [
    "school management system Kenya",
    "school management Uganda",
    "school management Tanzania",
    "school fees M-Pesa",
    "school fees M-Pesa Uganda",
    "CBC school software",
    "CBC gradebook Kenya",
    "KCSE gradebook",
    "NEMIS integration",
    "student information system East Africa",
    "school information system East Africa",
    "EduMyles",
    "school ERP Africa",
    "school management software Kenya 2025",
    "best school software Africa",
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "EduMyles",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "All-in-one school management system for East African schools. M-Pesa fee collection, CBC gradebook, parent portal, attendance tracking.",
  url: "https://edumyles.com",
  offers: {
    "@type": "Offer",
    price: "12900",
    priceCurrency: "KES",
    priceValidUntil: "2027-01-01",
  },
  publisher: {
    "@type": "Organization",
    name: "MylesCorp Technologies Ltd",
    url: "https://edumyles.com",
    logo: "https://edumyles.com/edumyles-wordmark-light.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254743993715",
      contactType: "sales",
      areaServed: ["KE", "UG", "TZ", "RW", "ZM"],
      availableLanguage: "English",
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EduMyles",
  url: "https://edumyles.com",
  logo: "https://edumyles.com/edumyles-wordmark-light.png",
  description: "School Management System for East African Schools",
  foundingDate: "2022",
  founders: [
    { "@type": "Person", name: "Jonathan Myles", sameAs: "https://linkedin.com/in/mylesoft" },
  ],
  areaServed: ["KE", "UG", "TZ", "RW", "ZM"],
  sameAs: ["https://twitter.com/edumyles", "https://linkedin.com/company/edumyles"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const googleTagId = gaId ?? adsId;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('em-site-theme');if(t!=='light'&&t!=='dark')t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
        {googleTagId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
              strategy="afterInteractive"
            />
            <Script id="google-tag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${gaId ? `gtag('config', '${gaId}');` : ""}
                ${adsId ? `gtag('config', '${adsId}');` : ""}
              `}
            </Script>
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-background text-foreground transition-colors duration-200"
      >
        <Suspense fallback={null}>
          <AttributionTracker />
        </Suspense>
        <PerformanceTracker />
        <ConditionalLayout>{children}</ConditionalLayout>
        <SpeedInsights />
      </body>
    </html>
  );
}
