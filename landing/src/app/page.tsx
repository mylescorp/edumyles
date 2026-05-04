import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Features from "@/components/sections/Features";
import Modules from "@/components/sections/Modules";
import Integrations from "@/components/sections/Integrations";
import Benefits from "@/components/sections/Benefits";
import Comparison from "@/components/sections/Comparison";
import HowItWorks from "@/components/sections/HowItWorks";
import BrandValues from "@/components/sections/BrandValues";
import ROICalculator from "@/components/sections/ROICalculator";
import Testimonial from "@/components/sections/Testimonial";
import MobileTeaser from "@/components/sections/MobileTeaser";
import Pricing from "@/components/sections/Pricing";
import FinalCTA from "@/components/sections/FinalCTA";

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div id="main-content">
        {/* Dark hero with floating dashboard cards */}
        <Hero />
        {/* Trust bar — school logos + metrics */}
        <Stats />
        {/* Problem section — why EduMyles exists */}
        <Features />
        {/* Platform modules — 3x2 card grid */}
        <Modules />
        {/* Integration logos — tools schools already use */}
        <Integrations />
        {/* Benefits by role — Admin / Teacher / Parent */}
        <Benefits />
        {/* Comparison table — EduMyles vs manual tools vs generic SaaS */}
        <Comparison />
        {/* How it works — 3 steps */}
        <HowItWorks />
        {/* Mission, Vision, Core Values & Founding Story */}
        <BrandValues />
        {/* Interactive ROI calculator */}
        <ROICalculator />
        {/* Testimonial — Mary K. quote */}
        <Testimonial />
        {/* Mobile-first teaser with phone preview */}
        <MobileTeaser />
        {/* Pricing plans */}
        <Pricing />
        {/* Final CTA */}
        <FinalCTA />
      </div>
    </>
  );
}
