import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAppHref } from "@/lib/appLinks";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "EduMyles Platform Handoff",
};

export default function PlatformPage() {
  redirect(getAppHref("/platform"));
}
