import Link from "next/link";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import Logo from "@/components/shared/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.returnTo) qs.set("returnTo", params.returnTo);
  const loginUrl = `/auth/login/api?${qs.toString()}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0A3020] via-[#0F4C2A] to-[#1B5E35] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#D4AF37] opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#1B5E35] opacity-20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0F4C2A] opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Glassmorphism card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4">
                <Logo variant="icon" size="lg" className="!text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back
              </h1>
              <p className="text-[#A8E6C3] text-sm">
                Sign in to your EduMyles account
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <span className="text-sm">Secure authentication powered by WorkOS</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <span className="text-sm">Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <span className="text-sm">Single sign-on with Google</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={loginUrl}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F7DF82] px-6 py-4 text-base font-semibold text-[#0A3020] transition-all duration-200 hover:shadow-lg hover:shadow-[#D4AF37]/25 hover:scale-[1.02]"
            >
              Sign in with WorkOS
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-[#D4AF37] font-semibold hover:underline"
                >
                  Join the waitlist
                </Link>
              </p>
            </div>
          </div>

          {/* Back to site */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#A8E6C3] text-sm font-medium hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to site
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
