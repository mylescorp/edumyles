import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Join the EduMyles School Waitlist",
  description:
    "Join the EduMyles school onboarding waitlist and share your institution details for rollout follow-up.",
  canonical: "/waitlist",
});

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
