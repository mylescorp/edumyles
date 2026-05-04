import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function AlumniPortalHandoffPage() {
  redirect(getAppHref("/portal/alumni"));
}
