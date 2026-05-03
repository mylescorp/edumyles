import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function StudentPortalHandoffPage() {
  redirect(getAppHref("/portal/student"));
}
