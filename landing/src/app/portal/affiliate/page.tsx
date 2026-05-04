import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function AffiliatePortalHandoffPage() {
  redirect(getAppHref("/portal/affiliate"));
}
