import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Modules from "@/components/sections/Modules";
import Benefits from "@/components/sections/Benefits";
import Comparison from "@/components/sections/Comparison";
import HowItWorks from "@/components/sections/HowItWorks";
import BrandValues from "@/components/sections/BrandValues";
import ROICalculator from "@/components/sections/ROICalculator";
import Testimonial from "@/components/sections/Testimonial";
import MobileTeaser from "@/components/sections/MobileTeaser";
import Pricing from "@/components/sections/Pricing";
import FinalCTA from "@/components/sections/FinalCTA";
import BoardSpotlight from "@/components/sections/BoardSpotlight";

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div id="main-content">
        {/* Dark hero with floating dashboard cards */}
        <Hero />
        {/* Problem section — why EduMyles exists */}
        <Features />
        {/* Platform modules — 3x2 card grid */}
        <Modules />
        <BoardSpotlight
          eyebrow="Academics"
          title="CBC, 8-4-4 and IGCSE gradebooks."
          description="Record assessments once and create clear reports for every learner, across the curricula your school teaches."
          points={["Curriculum-aware assessment", "Report cards in a few clicks", "Progress visible to families"]}
          href="/features"
          linkLabel="Explore academics"
          kind="gradebook"
        />
        <BoardSpotlight
          eyebrow="School fees"
          title="Fees collected through M-Pesa."
          description="Give families a familiar way to pay and keep fee records together with each learner’s account."
          points={["M-Pesa payment records", "Receipts linked to learners", "Balances available to your team"]}
          href="/features"
          linkLabel="Explore finance"
          kind="payments"
        />
        {/* Integration logos — tools schools already use */}
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
