import { redirect } from "next/navigation";

// All auth is handled by the main app — redirect directly to WorkOS sign-up.
export default function SignUpPage({
  searchParams,
}: {
  searchParams: { returnTo?: string; email?: string };
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qs = new URLSearchParams();
  if (searchParams.email) qs.set("email", searchParams.email);
  redirect(`${appUrl}/auth/signup/api?${qs.toString()}`);
}
