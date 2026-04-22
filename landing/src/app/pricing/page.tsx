import type { Metadata } from "next";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing — EduMyles School Management | Transparent KES Pricing",
  description:
    "Simple, transparent pricing for EduMyles school management. From KES 12,900/month. M-Pesa payment. Trusted by 50+ schools across Kenya, Uganda, Tanzania, Rwanda, and Zambia.",
};

export default function PricingPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "360px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{
              background: "rgba(232,160,32,0.12)",
              border: "1px solid #E8A020",
              color: "#E8A020",
            }}
          >
            Transparent Pricing
          </div>
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "#ffffff" }}
          >
            Simple pricing.{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              No surprises.
            </em>
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mx-auto"
            style={{ fontSize: "18px", color: "#90CAF9", maxWidth: "560px" }}
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
