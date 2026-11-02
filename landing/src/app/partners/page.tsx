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
    <div style={{ color: "var(--color-text-default)" }}>
      {/* Hero Section */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--color-surface-default)",
          borderTop: "3px solid var(--color-action-primary)",
          padding: "6rem 2rem 5rem",
          minHeight: "400px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[800px] mx-auto text-center">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-jakarta text-sm px-4 py-2 rounded-lg"
              style={{ background: "color-mix(in srgb, var(--color-surface-default) 10%, transparent)", color: "var(--color-text-muted)" }}
            >
              ← Back to Home
            </Link>
          </div>
          <div className="max-w-[600px]">
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{
                background: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
                border: "1px solid var(--color-text-on-primary-subtle)",
                color: "var(--color-text-on-primary-subtle)",
              }}
            >
              Partner Program
            </div>
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2rem,4vw,3rem)", color: "var(--color-text-inverse)" }}
            >
              Grow With <span style={{ color: "var(--color-text-on-primary-subtle)" }}>EduMyles</span>
            </h1>
            <p className="font-jakarta text-lg leading-[1.7]" style={{ color: "var(--color-text-muted)" }}>
              Join our partner ecosystem and help transform education across East Africa. We work
              with technology providers, educational consultants, and service companies to deliver
              comprehensive solutions to schools.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[1200px] mx-auto">
          {/* Partner Types */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Handshake,
                title: "Developer Partners",
                description:
                  "Build integrations, school workflow modules, and implementation services for the EduMyles ecosystem.",
                benefits: [
                  "Curated sandbox access",
                  "Module review pathway",
                  "Marketplace and co-sell options",
                  "Security and launch guidance",
                ],
                href: "/developers",
              },
              {
                icon: Globe,
                title: "Affiliate Partners",
                description:
                  "Refer schools through trusted audiences, school communities, content, and direct introductions.",
                benefits: [
                  "Tracked referral links",
                  "Share-ready messaging",
                  "Monthly payout reporting",
                  "No implementation burden",
                ],
                href: "/affiliate",
              },
              {
                icon: Users,
                title: "Reseller Partners",
                description:
                  "Sell, implement, and support EduMyles locally with recurring commission and partner enablement.",
                benefits: [
                  "Reseller sales kit",
                  "Co-sell support",
                  "White-label discussion path",
                  "Implementation fee opportunity",
                ],
                href: "/reseller",
              },
            ].map((partner) => (
              <Link
                key={partner.title}
                href={partner.href}
                className="p-6 rounded-xl no-underline transition-transform duration-200 hover:-translate-y-1"
                style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
                  >
                    <partner.icon className="w-6 h-6" style={{ color: "var(--color-action-primary)" }} />
                  </div>
                  <h3 className="font-jakarta font-bold text-lg" style={{ color: "var(--color-text-default)" }}>
                    {partner.title}
                  </h3>
                </div>
                <p className="font-jakarta text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                  {partner.description}
                </p>
                <ul className="space-y-2">
                  {partner.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "var(--color-action-primary)" }}
                      />
                      <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>

          {/* Partner Benefits */}
          <div className="mb-16">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
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
                  style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "var(--color-text-default)" }}>
                    {item.title}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                    {item.description}
                  </p>
                  <div className="text-center">
                    <div className="font-jakarta font-bold text-xl" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                      {item.stat}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Process */}
          <div className="mb-16">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
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
                      style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                    >
                      <span className="font-jakarta font-bold text-sm">
                        {step.step.split(" ")[1]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-bold text-lg mb-2"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {step.title}
                    </h3>
                    <p className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "var(--color-text-default)" }}>
              Ready to Partner With Us?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>
              Let&apos;s work together to transform education across East Africa.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
              >
                Contact Partnerships
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/reseller"
                className="inline-flex items-center gap-2 font-jakarta font-semibold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "transparent", color: "var(--color-text-default)", border: "2px solid var(--color-border-default)" }}
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
