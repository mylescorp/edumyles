import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function PartnerPortalHandoffPage() {
  redirect(getAppHref("/portal/partner"));
}
