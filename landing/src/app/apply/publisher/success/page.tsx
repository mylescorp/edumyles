"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  Clock,
  FileText,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

export default function PublisherApplicationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");

  return (
    <main className="min-h-screen bg-[#EEF6F1] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#0F4C2A] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-playfair text-4xl font-bold text-[#061A12] mb-4">
            Application Submitted!
          </h1>
          <p className="font-jakarta text-[18px] leading-7 text-[#5d6f66] mb-2">
            Your publisher application has been received successfully.
          </p>
          <p className="font-jakarta text-[15px] text-[#6B9E83]">
            Application ID: <span className="font-mono">{applicationId}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="font-playfair text-2xl font-bold text-[#061A12] mb-6">
            What Happens Next?
          </h2>
          
          <div className="space-y-6">
            {[
              {
                icon: FileText,
                title: "Application Review",
                description: "Our team will review your application within 3-5 business days.",
                time: "3-5 business days",
              },
              {
                icon: Mail,
                title: "Email Notification",
                description: "You'll receive an email with our decision and next steps.",
                time: "Within 5 business days",
              },
              {
                icon: CheckCircle2,
                title: "Account Setup",
                description: "If approved, we'll help you set up your publisher account and access.",
                time: "Within 7 business days",
              },
              {
                icon: Clock,
                title: "Onboarding",
                description: "Complete the onboarding process and start building modules.",
                time: "Within 10 business days",
              },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white font-jakarta text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-jakarta text-[16px] font-bold text-[#061A12] mb-1">
                    {step.title}
                  </h3>
                  <p className="font-jakarta text-[14px] text-[#5d6f66] mb-2">
                    {step.description}
                  </p>
                  <p className="font-jakarta text-[12px] text-[#1A7A4A] font-medium">
                    {step.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="font-playfair text-2xl font-bold text-[#061A12] mb-6">
            While You Wait
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-[#E8A020] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-[#061A12] mb-2">
                Prepare Your Development Environment
              </h3>
              <p className="font-jakarta text-[14px] text-[#5d6f66]">
                Set up your development tools and review our module development guidelines to get started quickly.
              </p>
            </div>
            
            <div className="border-l-4 border-[#E8A020] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-[#061A12] mb-2">
                Research School Needs
              </h3>
              <p className="font-jakarta text-[14px] text-[#5d6f66]">
                Understand the challenges East African schools face to build modules that solve real problems.
              </p>
            </div>
            
            <div className="border-l-4 border-[#E8A020] pl-4">
              <h3 className="font-jakarta text-[16px] font-bold text-[#061A12] mb-2">
                Join Our Community
              </h3>
              <p className="font-jakarta text-[14px] text-[#5d6f66]">
                Connect with other developers and education professionals in our community forums.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[999px] border border-[#0F4C2A] bg-[#0F4C2A] px-8 py-3 font-jakarta text-[15px] font-bold text-white transition-all duration-200 hover:border-[#061A12] hover:bg-[#061A12]"
            >
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[999px] border border-[#0F4C2A] bg-white px-8 py-3 font-jakarta text-[15px] font-bold text-[#0F4C2A] transition-all duration-200 hover:border-[#061A12] hover:bg-[#061A12] hover:text-white"
            >
              Contact Support
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-[#6B9E83]">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>publishers@edumyles.com</span>
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
