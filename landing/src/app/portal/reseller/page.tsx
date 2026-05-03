import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function ResellerPortalHandoffPage() {
  redirect(getAppHref("/portal/reseller"));
}
