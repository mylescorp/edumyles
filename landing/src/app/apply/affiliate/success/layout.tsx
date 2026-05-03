import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Affiliate Application Submitted",
};

export default function AffiliateSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
