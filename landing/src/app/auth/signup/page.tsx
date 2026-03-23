import { redirect } from "next/navigation";

// All auth is handled via WorkOS — redirect directly to the auth API route.
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.email) qs.set("email", params.email);
  redirect(`/auth/signup/api?${qs.toString()}`);
}
