import type { Metadata } from "next";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up — EduMyles",
  description:
    "Create your EduMyles account and start managing your school with a free 30-day trial.",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">EduMyles</h1>
          <p className="text-sm text-muted-foreground">
            Create your account and start managing your school
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
