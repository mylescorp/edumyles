import "../landing-premium.css";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import RevealObserver from "@/components/landing/RevealObserver";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RevealObserver />
      <LandingNavbar />
      {children}
      <LandingFooter />
    </>
  );
}
