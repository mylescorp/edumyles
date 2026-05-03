import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Waitlist Submission Confirmed",
};

export default function WaitlistSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
