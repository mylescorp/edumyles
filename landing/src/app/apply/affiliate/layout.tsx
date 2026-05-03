import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Affiliate Program Application",
  description:
    "Apply to become an EduMyles affiliate and earn commission by referring schools to the EduMyles school management platform.",
  canonical: "/apply/affiliate",
});

export default function AffiliateApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
