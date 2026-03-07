import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.error) {
    query.set("error", params.error);
  }
  if (params.next) {
    query.set("next", params.next);
  }
  if (params.returnTo) {
    query.set("returnTo", params.returnTo);
  }

  const suffix = query.toString();
  redirect(`/auth/login/api${suffix ? `?${suffix}` : ""}`);
}
