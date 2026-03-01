import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import SignUpForm from "./SignUpForm";
import Link from "next/link";

export const metadata = {
  title: "Sign Up — EduMyles",
};

export default async function SignUpPage() {
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
            Create your account and start managing your school
          </p>
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
