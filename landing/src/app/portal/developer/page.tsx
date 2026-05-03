import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function DeveloperPortalHandoffPage() {
  redirect(getAppHref("/portal/developer"));
}
