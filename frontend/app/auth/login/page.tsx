import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LoginForm from "../../../src/app/auth/login/LoginForm";
import Link from "next/link";

export const metadata = {
  title: "Sign In — EduMyles",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("edumyles_session");
  if (session?.value) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            EduMyles
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your school management platform
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
