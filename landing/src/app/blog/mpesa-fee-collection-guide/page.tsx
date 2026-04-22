import type { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Smartphone,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How to Set Up M-Pesa Fee Collection for Your School in Under 30 Minutes",
  description:
    "A step-by-step guide to integrating M-Pesa Daraja into your EduMyles fee structure and going fully cashless. Complete walkthrough with screenshots and best practices.",
};

export default function MpesaFeeCollectionGuide() {
  return (
    <div style={{ color: "#212121" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 50%, #1A7A4A 100%)",
          padding: "6rem 2rem 4rem",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(232,160,32,0.3) 0%, transparent 50%), 
                            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        <div className="relative max-w-[800px] mx-auto">
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-jakarta text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.1)", color: "#A8E6C3" }}
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="max-w-[800px]">
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "#ffffff" }}
            >
              How to Set Up M-Pesa Fee Collection{" "}
              <span style={{ color: "#E8A020" }}>for Your School</span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>
                  Finance
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>
                  6 min read
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>
                  February 2026
                </span>
              </div>
            </div>

            <p className="font-jakarta text-lg leading-[1.7]" style={{ color: "#A8E6C3" }}>
              A step-by-step guide to integrating M-Pesa Daraja into your EduMyles fee structure and
              going fully cashless. Transform your school&apos;s fee collection process in under 30
              minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[800px] mx-auto">
          {/* Introduction */}
          <div className="mb-12">
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "#374151" }}>
              Managing school fees has always been a challenge for Kenyan educational institutions.
              Manual cash handling, tracking payments, and following up with parents takes countless
              hours each term. But what if you could automate 95% of this work?
            </p>

            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "#374151" }}>
              With EduMyles and M-Pesa integration, you can. This guide will walk you through
              setting up a complete digital fee collection system that processes payments
              automatically, sends instant receipts to parents, and gives you real-time visibility
              into your school&apos;s financial health.
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "linear-gradient(135deg, #F3FBF6 0%, #E8F5EE 100%)",
                border: "1px solid rgba(26,122,74,0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6" style={{ color: "#1A7A4A" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "#061A12" }}>
                  Quick Results
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "95% reduction in cash handling",
                  "60% faster fee collection",
                  "100% automatic receipt generation",
                  "Real-time payment tracking",
                ].map((result) => (
                  <li key={result} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                    <span className="font-jakarta text-sm" style={{ color: "#374151" }}>
                      {result}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What You'll Need */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              What You&apos;ll Need
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Smartphone,
                  title: "M-Pesa Business Till Number",
                  description: "A registered M-Pesa business account with Paybill or Till number",
                },
                {
                  icon: Shield,
                  title: "Safaricom Daraja API Keys",
                  description: "Consumer Key and Secret from Safaricom Developer Portal",
                },
                {
                  icon: CreditCard,
                  title: "EduMyles Account",
                  description: "Active EduMyles subscription with fee management module",
                },
                {
                  icon: AlertCircle,
                  title: "Bank Account",
                  description: "Bank account details for automated settlement",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(26,122,74,0.1)" }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: "#1A7A4A" }} />
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-semibold text-base mb-1"
                      style={{ color: "#061A12" }}
                    >
                      {item.title}
                    </h3>
                    <p className="font-jakarta text-sm" style={{ color: "#5a5a5a" }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Step-by-Step Setup Guide
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: "Step 1",
                  title: "Register for M-Pesa Business Account",
                  content:
                    "Visit any Safaricom shop with your business registration documents, ID, and KRA PIN. Request a Paybill number for your school. The process typically takes 24-48 hours.",
                  time: "5 minutes",
                },
                {
                  step: "Step 2",
                  title: "Get Daraja API Credentials",
                  content:
                    "Go to developer.safaricom.co.ke and register for a developer account. Create a new app and request production API keys for M-Pesa. You'll receive a Consumer Key and Consumer Secret.",
                  time: "10 minutes",
                },
                {
                  step: "Step 3",
                  title: "Configure M-Pesa in EduMyles",
                  content:
                    "Log into your EduMyles dashboard, navigate to Settings > Payment Methods, and select M-Pesa. Enter your Paybill number, Consumer Key, and Consumer Secret. Test the connection.",
                  time: "5 minutes",
                },
                {
                  step: "Step 4",
                  title: "Set Up Fee Structure",
                  content:
                    "Create your fee categories (tuition, boarding, transport, etc.) and assign amounts per class. EduMyles will automatically calculate totals per student.",
                  time: "8 minutes",
                },
                {
                  step: "Step 5",
                  title: "Enable Parent Notifications",
                  content:
                    "Configure automatic SMS and email notifications for payment confirmations, reminders, and receipts. Parents will receive instant payment alerts.",
                  time: "2 minutes",
                },
              ].map((step) => (
                <div key={step.step} className="border-l-4 pl-6" style={{ borderColor: "#E8A020" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-jakarta font-bold text-sm px-3 py-1 rounded-full"
                      style={{ background: "#E8A020", color: "#061A12" }}
                    >
                      {step.step}
                    </span>
                    <span className="font-jakarta text-sm" style={{ color: "#5a5a5a" }}>
                      {step.time}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3" style={{ color: "#061A12" }}>
                    {step.title}
                  </h3>
                  <p className="font-jakarta text-base leading-[1.7]" style={{ color: "#374151" }}>
                    {step.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Best Practices for Success
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Test with Small Amounts First",
                  description:
                    "Before going live, test the system with small payments (KES 100-500) to ensure everything works smoothly.",
                },
                {
                  title: "Train Your Finance Team",
                  description:
                    "Conduct a 30-minute training session with your bursar and finance staff on the new system.",
                },
                {
                  title: "Communicate with Parents",
                  description:
                    "Send a detailed notice to parents explaining the new payment system and benefits.",
                },
                {
                  title: "Set Up Daily Reconciliation",
                  description:
                    "Schedule daily reconciliation of M-Pesa transactions with your EduMyles records.",
                },
              ].map((practice) => (
                <div
                  key={practice.title}
                  className="p-5 rounded-xl"
                  style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}
                >
                  <h3
                    className="font-jakarta font-semibold text-base mb-2"
                    style={{ color: "#061A12" }}
                  >
                    {practice.title}
                  </h3>
                  <p className="font-jakarta text-sm leading-[1.6]" style={{ color: "#5a5a5a" }}>
                    {practice.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Results You Can Expect */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Results You Can Expect
            </h2>

            <div
              className="p-8 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 100%)",
                color: "#ffffff",
              }}
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-display font-bold text-xl mb-4" style={{ color: "#E8A020" }}>
                    Before M-Pesa Integration
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Manual cash handling daily",
                      "Payment tracking in Excel sheets",
                      "Parents queuing at school office",
                      "Receipt books and manual records",
                      "30% late payment rate",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <AlertCircle
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "#ef4444" }}
                        />
                        <span className="font-jakarta text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-display font-bold text-xl mb-4" style={{ color: "#E8A020" }}>
                    After M-Pesa Integration
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "100% digital payments",
                      "Real-time payment dashboard",
                      "Parents pay from anywhere",
                      "Instant digital receipts",
                      "95% on-time payment rate",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "#E8A020" }}
                        />
                        <span className="font-jakarta text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "#061A12" }}>
              Ready to Transform Your Fee Collection?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "#5a5a5a" }}>
              Join 500+ Kenyan schools using EduMyles for seamless M-Pesa integration.
            </p>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Book a Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
