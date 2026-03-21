import { redirect } from "next/navigation";

// All auth is handled by the main app — redirect directly to WorkOS sign-up.
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; email?: string }>;
}) {
  const params = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qs = new URLSearchParams();
  if (params.email) qs.set("email", params.email);
  redirect(`${appUrl}/auth/signup/api?${qs.toString()}`);
}
