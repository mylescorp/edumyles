import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — EduMyles",
  description: "Sign in to your EduMyles school management platform.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            EduMyles
          </Link>
          <p>Sign in to your school management platform</p>
        </div>
        <LoginForm initialError={errorParam} />
      </div>
    </div>
  );
}
