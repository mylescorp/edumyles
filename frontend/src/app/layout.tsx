import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduMyles",
  description: "School management portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
