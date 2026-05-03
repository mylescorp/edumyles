import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Publisher Application",
  description: "Legacy publisher application route for EduMyles marketplace applicants.",
};

export default function PublisherApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
