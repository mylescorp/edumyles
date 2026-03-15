import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ConditionalLayout from "@/components/ConditionalLayout";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduMyles — School Management System for East Africa | Powered by Mylesoft",
  description:
    "EduMyles is the all-in-one school management platform for Kenyan schools. M-Pesa fees, digital gradebooks, parent communication & more. Book a free demo.",
  openGraph: {
    title: "EduMyles — School Management System for East Africa",
    description: "The all-in-one school management platform for East African schools. M-Pesa fees, digital gradebooks, parent communication & more.",
    url: "https://edumyles.com",
    siteName: "EduMyles",
    type: "website",
    images: [{ url: "https://edumyles.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduMyles — School Management System for East Africa",
    description: "The all-in-one school management platform for East African schools.",
  },
  robots: { index: true, follow: true },
  keywords: ["school management system Kenya", "school fees M-Pesa", "CBC school software", "student information system East Africa", "EduMyles"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('em-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} ${inter.variable} font-inter antialiased bg-white text-dark-grey`}>
        <ConditionalLayout>{children}</ConditionalLayout>
        <SpeedInsights />
      </body>
    </html>
  );
}
