import { redirect } from "next/navigation";

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
