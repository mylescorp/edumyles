import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Reseller Application Submitted",
};

export default function ResellerSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
