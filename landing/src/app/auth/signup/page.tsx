import type { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign up — EduMyles",
  description:
    "Create your EduMyles account and start managing your school.",
};

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            EduMyles
          </Link>
          <p>Create your account and start managing your school</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
