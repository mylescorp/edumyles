import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In — EduMyles",
  description: "Sign in to your EduMyles school management platform.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">EduMyles</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your school management platform
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
