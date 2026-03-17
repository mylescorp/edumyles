import { redirect } from "next/navigation";

// Platform dashboard lives in the frontend app — redirect home
export default function PlatformPage() {
  redirect("/");
}
