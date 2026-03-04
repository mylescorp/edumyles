import { redirect } from "next/navigation";

/**
 * Auth lives on the landing app (edumyles.vercel.app).
 * Redirect to landing signup when NEXT_PUBLIC_AUTH_BASE_URL is set.
 */
export default function SignupRedirectPage() {
  const authBase = process.env.NEXT_PUBLIC_AUTH_BASE_URL;
  if (authBase) {
    redirect(`${authBase}/auth/signup`);
  }
  redirect("/");
}
