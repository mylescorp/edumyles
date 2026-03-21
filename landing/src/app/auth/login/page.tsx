import { redirect } from "next/navigation";

// All auth is handled by the main app — redirect directly to WorkOS sign-in.
export default function LoginPage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qs = new URLSearchParams();
  if (searchParams.returnTo) qs.set("returnTo", searchParams.returnTo);
  redirect(`${appUrl}/auth/login/api?${qs.toString()}`);
}
