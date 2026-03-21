import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Features from "@/components/sections/Features";
import Modules from "@/components/sections/Modules";
import HowItWorks from "@/components/sections/HowItWorks";
import Pricing from "@/components/sections/Pricing";
import FinalCTA from "@/components/sections/FinalCTA";

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div id="main-content">
        <Hero />
        <Stats />
        <Features />
        <Modules />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
      </div>
    </>
  );
}
