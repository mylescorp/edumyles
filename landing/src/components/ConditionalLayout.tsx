"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";
import WhatsAppFAB from "@/components/ui/WhatsAppFAB";
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
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFAB />
      <CookieBanner />
    </>
  );
}
