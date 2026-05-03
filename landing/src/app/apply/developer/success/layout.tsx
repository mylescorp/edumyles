import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Developer Application Submitted",
};

export default function DeveloperSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
