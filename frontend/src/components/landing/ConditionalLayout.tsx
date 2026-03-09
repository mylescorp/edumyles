"use client";

import { usePathname } from "next/navigation";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";

const HIDE_LANDING_LAYOUT = ["/admin", "/platform", "/portal", "/dashboard"];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = HIDE_LANDING_LAYOUT.some((p) => pathname.startsWith(p));

  if (hide) return <>{children}</>;

  // Also hide on auth pages - they have their own layout
  if (pathname.startsWith("/auth")) return <>{children}</>;

  return (
    <>
      <LandingNavbar />
      {children}
      <LandingFooter />
    </>
  );
}
