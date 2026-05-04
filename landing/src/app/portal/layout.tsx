import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "EduMyles Portal Handoff",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
