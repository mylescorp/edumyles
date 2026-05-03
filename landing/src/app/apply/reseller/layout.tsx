import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Reseller Program Application",
  description:
    "Apply to become an EduMyles reseller for schools, education consultants, and regional technology partners.",
  canonical: "/apply/reseller",
});

export default function ResellerApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
