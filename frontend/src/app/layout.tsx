import type { Metadata } from "next";
import "./globals.css";
import { ConvexProviderWrapper } from "@/components/providers/ConvexProviderWrapper";

export const metadata: Metadata = {
  title: { default: "EduMyles", template: "%s | EduMyles" },
  description: "Multi-tenant school management platform for East Africa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ConvexProviderWrapper>{children}</ConvexProviderWrapper>
      </body>
    </html>
  );
}
