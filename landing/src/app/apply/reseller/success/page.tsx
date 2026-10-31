"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Mail, Phone, FileText, TrendingUp } from "lucide-react";
import { getAppHref } from "@/lib/appLinks";

function ResellerApplicationSuccessContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const resellerPortalHref = getAppHref("/portal/reseller");

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
            Your reseller application has been received successfully.
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
                  "Our partnership team will review your application and business credentials.",
                time: "3-5 business days",
              },
              {
                icon: Mail,
                title: "Email Notification",
                description: "You'll receive an email with our decision and partnership details.",
                time: "Within 5 business days",
              },
              {
                icon: CheckCircle2,
                title: "Partnership Agreement",
                description:
                  "If approved, we'll send a partnership agreement and commission structure.",
                time: "Within 7 business days",
              },
              {
                icon: TrendingUp,
                title: "Onboarding & Training",
                description: "Complete onboarding, get marketing materials, and start selling.",
                time: "Within 10 business days",
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
            Prepare for Success
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-[var(--accent-foreground)] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-2">
                Research Your Target Market
              </h3>
              <p className="font-jakarta text-[14px] text-muted-foreground">
                Identify schools in your area that could benefit from EduMyles and understand their
                current challenges.
              </p>
            </div>

            <div className="border-l-4 border-[var(--accent-foreground)] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-2">
                Prepare Your Marketing Strategy
              </h3>
              <p className="font-jakarta text-[14px] text-muted-foreground">
                Think about how you&apos;ll reach school administrators and decision-makers in your
                target region.
              </p>
            </div>

            <div className="border-l-4 border-[var(--accent-foreground)] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-foreground mb-2">
                Understand the Product
              </h3>
              <p className="font-jakarta text-[14px] text-muted-foreground">
                Familiarize yourself with EduMyles features, benefits, and pricing to effectively
                communicate value to schools.
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
              href={resellerPortalHref}
              className="inline-flex items-center justify-center rounded-[999px] border border-primary bg-card px-8 py-3 font-jakarta text-[15px] font-bold text-primary transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Reseller Portal
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>partnerships@edumyles.com</span>
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

export default function ResellerApplicationSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResellerApplicationSuccessContent />
    </Suspense>
  );
}
