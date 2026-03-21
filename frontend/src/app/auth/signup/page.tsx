import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.email) qs.set("email", params.email);
  redirect(`/auth/signup/api?${qs.toString()}`);
}
