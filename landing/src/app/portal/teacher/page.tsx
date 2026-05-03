import { redirect } from "next/navigation";
import { getAppHref } from "@/lib/appLinks";

export default function TeacherPortalHandoffPage() {
  redirect(getAppHref("/portal/teacher"));
}
