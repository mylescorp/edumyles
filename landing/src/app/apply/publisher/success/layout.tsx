import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Publisher Application Submitted",
};

export default function PublisherSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
