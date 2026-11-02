import type { Metadata } from "next";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing — EduMyles School Management | Transparent KES Pricing",
  description:
    "Simple, transparent pricing for EduMyles school management. From KES 12,900/month. M-Pesa payment. Trusted by schools across Kenya, Uganda, Tanzania, Rwanda, and Zambia.",
};

export default function PricingPage() {
  return (
    <div style={{ color: "var(--foreground)" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="handoff-pricing-hero page-hero"
        style={{
          background: "var(--bg)",
        }}
      >
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{
              background: "rgb(var(--primary-rgb) / 12%)",
              border: "1px solid var(--accent-foreground)",
              color: "var(--accent-foreground)",
            }}
          >
            Transparent Pricing
          </div>
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "var(--foreground)" }}
          >
            Simple pricing.{" "}
            <em className="italic" style={{ color: "var(--accent-foreground)" }}>
              No surprises.
            </em>
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mx-auto"
            style={{ fontSize: "18px", color: "var(--muted-foreground)", maxWidth: "560px" }}
          >
            No per-user fees. No hidden charges. Pay per school, per month. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Interactive content (billing toggle, cards, FAQ) ── */}
      <PricingContent />
    </div>
  );
}
