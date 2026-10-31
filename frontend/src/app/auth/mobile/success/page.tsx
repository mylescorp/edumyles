import { Check } from "lucide-react";

export default function MobileAuthSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
          <Check aria-hidden="true" className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Mobile sign-in approved</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your EduMyles mobile app can finish signing in now. You can return to the app on your
          phone and close this browser tab.
        </p>
      </div>
    </div>
  );
}
