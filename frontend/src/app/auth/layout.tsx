import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — EduMyles",
  description: "Sign in to your EduMyles school management account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3FBF6] dark:bg-[#061A12]">
      {children}
    </div>
  );
}
