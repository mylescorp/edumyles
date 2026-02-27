import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduMyles — School Management for East Africa",
  description: "Multi-tenant school management platform for East Africa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
