import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status",
  description: "Check current EduMyles public system status and recent platform updates.",
  alternates: {
    canonical: "/status",
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
