import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Developer Program Application",
  description:
    "Apply to build EduMyles marketplace modules and access the developer portal after approval.",
  canonical: "/apply/developer",
});

export default function DeveloperApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
