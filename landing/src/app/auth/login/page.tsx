import { redirect } from "next/navigation";

// All auth is handled via WorkOS — redirect directly to the auth API route.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.returnTo) qs.set("returnTo", params.returnTo);
  redirect(`/auth/login/api?${qs.toString()}`);
}
