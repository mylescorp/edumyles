import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign In",
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
            Multi-tenant school management platform for East Africa
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
