import Navbar from "@/components/nav/Navbar";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Features from "@/components/sections/Features";
import Modules from "@/components/sections/Modules";
import HowItWorks from "@/components/sections/HowItWorks";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/footer/Footer";
import WhatsAppFAB from "@/components/ui/WhatsAppFAB";
import CookieBanner from "@/components/ui/CookieBanner";

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Stats />
        <Features />
        <Modules />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppFAB />
      <CookieBanner />
    </>
  );
}
