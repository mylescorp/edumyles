"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Mail, Phone, Clock, FileText, Share2 } from "lucide-react";
import { getAppHref } from "@/lib/appLinks";

function AffiliateApplicationSuccessContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const affiliatePortalHref = getAppHref("/portal/affiliate");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Application Submitted!
          </h1>
          <p className="font-jakarta text-[18px] leading-7 text-muted-foreground mb-2">
            Your affiliate application has been received successfully.
          </p>
          <p className="font-jakarta text-[15px] text-[var(--muted-foreground)]">
            Application ID: <span className="font-mono">{applicationId}</span>
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            What Happens Next?
          </h2>

          <div className="space-y-6">
            {[
              {
                icon: FileText,
                title: "Application Review",
                description:
                  "Our affiliate team will review your application and promotional strategy.",
                time: "3-5 business days",
              },
              {
                icon: Mail,
                title: "Email Notification",
                description:
                  "You'll receive an email with your affiliate account details and referral link.",
                time: "Within 5 business days",
              },
              {
                icon: Share2,
                title: "Get Your Referral Link",
                description:
                  "Access your affiliate dashboard with tracking links and marketing materials.",
                time: "Within 7 business days",
              },
              {
                icon: Clock,
                title: "Start Earning",
                description:
                  "Begin sharing your referral link and earning commissions on school subscriptions.",
                time: "Immediately after approval",
              },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-jakarta text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="font-jakarta text-[14px] text-muted-foreground mb-2">{step.description}</p>
                  <p className="font-jakarta text-[12px] text-primary font-medium">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            Affiliate Program Benefits
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-[var(--accent-foreground)] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-2">
                10% Commission Rate
              </h3>
              <p className="font-jakarta text-[14px] text-muted-foreground">
                Earn 10% commission on every school subscription that comes through your referral
                link.
              </p>
            </div>

            <div className="border-l-4 border-[var(--accent-foreground)] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-2">
                30-Day Cookie Tracking
              </h3>
              <p className="font-jakarta text-[14px] text-muted-foreground">
                Get credit for schools that sign up within 30 days of clicking your referral link.
              </p>
            </div>

            <div className="border-l-4 border-[var(--accent-foreground)] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-2">
                Marketing Materials
              </h3>
              <p className="font-jakarta text-[14px] text-muted-foreground">
                Access ready-to-use marketing materials, banners, and content to help you promote
                EduMyles.
              </p>
            </div>

            <div className="border-l-4 border-[var(--accent-foreground)] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-2">
                Real-Time Dashboard
              </h3>
              <p className="font-jakarta text-[14px] text-muted-foreground">
                Track clicks, conversions, and earnings in real-time through your affiliate
                dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[999px] border border-primary bg-primary px-8 py-3 font-jakarta text-[15px] font-bold text-primary-foreground transition-all duration-200 hover:border-primary hover:bg-primary"
            >
              Back to Home
            </Link>
            <a
              href={affiliatePortalHref}
              className="inline-flex items-center justify-center rounded-[999px] border border-primary bg-card px-8 py-3 font-jakarta text-[15px] font-bold text-primary transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Affiliate Portal
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>affiliates@edumyles.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+254 743 993 715</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AffiliateApplicationSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AffiliateApplicationSuccessContent />
    </Suspense>
  );
}
