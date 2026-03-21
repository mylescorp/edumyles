import { redirect } from "next/navigation";

// All auth is handled by the main app — redirect directly to WorkOS sign-in.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qs = new URLSearchParams();
  if (params.returnTo) qs.set("returnTo", params.returnTo);
  redirect(`${appUrl}/auth/login/api?${qs.toString()}`);
}
