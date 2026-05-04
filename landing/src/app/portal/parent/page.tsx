import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function ParentPortalHandoffPage() {
  redirect(getAppHref("/portal/parent"));
}
