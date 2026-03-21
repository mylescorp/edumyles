import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — EduMyles",
  description: "Sign in to EduMyles and continue to your school dashboard.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo;
  const error = params.error;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            EduMyles
          </Link>
          <p>Sign in to continue to your school dashboard</p>
        </div>
        {error ? (
          <div className="auth-error" role="alert">
            {decodeURIComponent(error)}
          </div>
        ) : null}
        <LoginForm returnTo={returnTo} />
      </div>
    </div>
  );
}
