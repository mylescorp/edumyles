import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduMyles — School Management for East Africa",
  description:
    "Replace disconnected spreadsheets and messaging groups with one unified platform for admissions, billing, academics, HR, and communication across East Africa.",
  other: {
    "msapplication-TileColor": "#056C40",
  },
};

export const viewport: Viewport = {
  themeColor: "#056C40",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
