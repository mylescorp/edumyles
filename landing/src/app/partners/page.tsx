import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Globe, Users, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Partners — EduMyles | School Management Partnerships",
  description:
    "Partner with EduMyles to bring world-class school management to East African schools. Join our partner program and grow with us.",
};

export default function PartnersPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* Hero Section */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "400px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[800px] mx-auto text-center">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-jakarta text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.1)", color: "#A8E6C3" }}
            >
              ← Back to Home
            </Link>
          </div>
          <div className="max-w-[600px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{
                background: "rgba(232,160,32,0.12)",
                border: "1px solid #E8A020",
                color: "#E8A020",
              }}
            >
              Partner Program
            </div>
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2rem,4vw,3rem)", color: "#ffffff" }}
            >
              Grow With <span style={{ color: "#E8A020" }}>EduMyles</span>
            </h1>
            <p className="font-jakarta text-lg leading-[1.7]" style={{ color: "#A8E6C3" }}>
              Join our partner ecosystem and help transform education across East Africa. We work
              with technology providers, educational consultants, and service companies to deliver
              comprehensive solutions to schools.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          {/* Partner Types */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Handshake,
                title: "Technology Partners",
                description:
                  "Integrate your tools with EduMyles and reach thousands of schools across East Africa.",
                benefits: [
                  "API access and documentation",
                  "Co-marketing opportunities",
                  "Joint customer success",
                  "Revenue sharing models",
                ],
              },
              {
                icon: Globe,
                title: "Reseller Partners",
                description:
                  "Sell EduMyles to schools in your region and earn competitive commissions.",
                benefits: [
                  "Generous commission structure",
                  "Sales training and support",
                  "Marketing materials",
                  "Lead generation support",
                ],
              },
              {
                icon: Users,
                title: "Implementation Partners",
                description:
                  "Help schools implement EduMyles and provide ongoing support services.",
                benefits: [
                  "Implementation training",
                  "Technical certification",
                  "Customer referrals",
                  "Partnership discounts",
                ],
              },
            ].map((partner) => (
              <div
                key={partner.title}
                className="p-6 rounded-xl"
                style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(26,122,74,0.1)" }}
                  >
                    <partner.icon className="w-6 h-6" style={{ color: "#1A7A4A" }} />
                  </div>
                  <h3 className="font-jakarta font-bold text-lg" style={{ color: "#061A12" }}>
                    {partner.title}
                  </h3>
                </div>
                <p className="font-jakarta text-sm mb-4" style={{ color: "#5a5a5a" }}>
                  {partner.description}
                </p>
                <ul className="space-y-2">
                  {partner.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "#1A7A4A" }}
                      />
                      <span className="font-jakarta text-sm" style={{ color: "#374151" }}>
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Partner Benefits */}
          <div className="mb-16">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Why Partner With EduMyles?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Market Leader",
                  description:
                    "Trusted by schools across Kenya, Uganda, Tanzania, Rwanda, and Zambia.",
                  stat: "Regional Schools",
                },
                {
                  title: "Growing Market",
                  description:
                    "East African education market growing at 15% annually with increasing digital adoption.",
                  stat: "15% Annual Growth",
                },
                {
                  title: "Proven Platform",
                  description:
                    "Battle-tested with real-world experience in diverse educational environments.",
                  stat: "5+ Years Experience",
                },
                {
                  title: "Local Support",
                  description:
                    "On-ground teams and local expertise across all East African countries.",
                  stat: "4 Countries Covered",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-xl"
                  style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "#061A12" }}>
                    {item.title}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "#5a5a5a" }}>
                    {item.description}
                  </p>
                  <div className="text-center">
                    <div className="font-jakarta font-bold text-xl" style={{ color: "#E8A020" }}>
                      {item.stat}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Process */}
          <div className="mb-16">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Partnership Application Process
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: "Step 1",
                  title: "Initial Contact",
                  description:
                    "Reach out to our partnerships team with your company information and partnership proposal.",
                },
                {
                  step: "Step 2",
                  title: "Evaluation",
                  description:
                    "We review your proposal and assess alignment with our mission and technical requirements.",
                },
                {
                  step: "Step 3",
                  title: "Partnership Agreement",
                  description: "We negotiate terms and establish a formal partnership agreement.",
                },
                {
                  step: "Step 4",
                  title: "Onboarding & Launch",
                  description:
                    "We provide training, resources, and support to ensure a successful partnership launch.",
                },
              ].map((step) => (
                <div key={step.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "#E8A020", color: "#061A12" }}
                    >
                      <span className="font-jakarta font-bold text-sm">
                        {step.step.split(" ")[1]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-bold text-lg mb-2"
                      style={{ color: "#061A12" }}
                    >
                      {step.title}
                    </h3>
                    <p className="font-jakarta text-sm" style={{ color: "#5a5a5a" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "#061A12" }}>
              Ready to Partner With Us?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "#5a5a5a" }}>
              Let&apos;s work together to transform education across East Africa.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "#E8A020", color: "#061A12" }}
              >
                Contact Partnerships
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/resellers"
                className="inline-flex items-center gap-2 font-jakarta font-semibold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "transparent", color: "#061A12", border: "2px solid #061A12" }}
              >
                Become Reseller
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
