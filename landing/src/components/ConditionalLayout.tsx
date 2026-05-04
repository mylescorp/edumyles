"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";
import ContactLauncher from "@/components/ui/ContactLauncher";
import ProgressBar from "@/components/ui/ProgressBar";
import CookieBanner from "@/components/ui/CookieBanner";

const NO_SHELL_PATHS = ["/auth", "/admin", "/platform", "/portal"];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noShell = NO_SHELL_PATHS.some((p) => pathname.startsWith(p));

  if (noShell) return <>{children}</>;

  return (
    <>
      <ProgressBar />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main>{children}</main>
      <Footer />
      <ContactLauncher />
      <CookieBanner />
    </>
  );
}
