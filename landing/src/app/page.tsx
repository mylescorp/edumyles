import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Features from "@/components/sections/Features";
import Modules from "@/components/sections/Modules";
import Benefits from "@/components/sections/Benefits";
import HowItWorks from "@/components/sections/HowItWorks";
import BrandValues from "@/components/sections/BrandValues";
import Testimonial from "@/components/sections/Testimonial";
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
        {/* Benefits by role — Admin / Teacher / Parent */}
        <Benefits />
        {/* How it works — 3 steps */}
        <HowItWorks />
        {/* Mission, Vision, Core Values & Founding Story */}
        <BrandValues />
        {/* Testimonial — Mary K. quote */}
        <Testimonial />
        {/* Pricing plans */}
        <Pricing />
        {/* Final CTA */}
        <FinalCTA />
      </div>
    </>
  );
}
