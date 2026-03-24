import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Users, CheckCircle, Star, Phone, Mail, MapPin, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Book a Demo — EduMyles | School Management System",
  description:
    "Schedule a personalized demo of EduMyles school management system. See how our platform can transform your school administration.",
};

export default function BookDemoPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* Hero Section */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "500px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full">
          <div className="max-w-[680px]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-jakarta text-[13px] mb-6 no-underline"
              style={{ color: "#6B9E83" }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Back to Home
            </Link>
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}
            >
              Schedule a Demo
            </div>
            <h1
              className="font-playfair font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2rem,4vw,3.5rem)", color: "#ffffff" }}
            >
              See EduMyles in Action
            </h1>
            <p
              className="font-jakarta text-[18px] leading-[1.7] mb-8"
              style={{ color: "#A8E6C3" }}
            >
              Get a personalized 30-minute demo tailored to your school's needs. 
              See how our platform simplifies administration, enhances communication, 
              and improves student outcomes.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-[14px]" style={{ color: "#ffffff" }}>
                  No credit card required
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-[14px]" style={{ color: "#ffffff" }}>
                  30-minute sessions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-[14px]" style={{ color: "#ffffff" }}>
                  Live Q&A included
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Form Section */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2
                className="font-playfair font-bold mb-4"
                style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", color: "#061A12" }}
              >
                Schedule Your Demo
              </h2>
              <p className="font-jakarta text-[16px] mb-8" style={{ color: "#5a5a5a" }}>
                Fill in your details and we'll contact you within 24 hours to schedule your personalized demo.
              </p>
              
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                      style={{ color: "#212121" }}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                      style={{ color: "#212121" }}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                      style={{ color: "#212121" }}
                      placeholder="john@school.ac.ke"
                    />
                  </div>
                  <div>
                    <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                      style={{ color: "#212121" }}
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                    style={{ color: "#212121" }}
                    placeholder="Nairobi Green Academy"
                  />
                </div>

                <div>
                  <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                    School Type *
                  </label>
                  <select
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                    style={{ color: "#212121" }}
                  >
                    <option value="">Select school type</option>
                    <option value="primary">Primary School</option>
                    <option value="secondary">Secondary School</option>
                    <option value="mixed">Mixed Primary & Secondary</option>
                    <option value="international">International School</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                    style={{ color: "#212121" }}
                    placeholder="Principal, Administrator, etc."
                  />
                </div>

                <div>
                  <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                    Preferred Demo Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                    style={{ color: "#212121" }}
                  />
                </div>

                <div>
                  <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                    Tell us about your school's needs (optional)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                    style={{ color: "#212121", resize: "vertical" }}
                    placeholder="What challenges are you looking to solve? What features interest you most?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full font-jakarta font-bold text-[16px] px-8 py-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "#061A12", color: "#ffffff", border: "none", cursor: "pointer" }}
                >
                  Request Demo
                </button>
              </form>
            </div>

            {/* What to Expect */}
            <div>
              <h3
                className="font-playfair font-bold mb-6"
                style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", color: "#061A12" }}
              >
                What to Expect
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E8A020" }}
                  >
                    <CalendarDays className="w-6 h-6" style={{ color: "#061A12" }} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-[16px] mb-2" style={{ color: "#061A12" }}>
                      Personalized Walkthrough
                    </h4>
                    <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "#5a5a5a" }}>
                      We'll show you exactly how EduMyles addresses your specific challenges and workflows.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E8A020" }}
                  >
                    <Users className="w-6 h-6" style={{ color: "#061A12" }} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-[16px] mb-2" style={{ color: "#061A12" }}>
                      Live Q&A Session
                    </h4>
                    <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "#5a5a5a" }}>
                      Get answers to your specific questions from our education technology experts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E8A020" }}
                  >
                    <CheckCircle className="w-6 h-6" style={{ color: "#061A12" }} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-[16px] mb-2" style={{ color: "#061A12" }}>
                      No-Obligation Consultation
                    </h4>
                    <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "#5a5a5a" }}>
                      Learn how EduMyles can benefit your school without any pressure to commit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-10 p-6 rounded-2xl" style={{ background: "#061A12", borderLeft: "4px solid #E8A020" }}>
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5" style={{ color: "#E8A020" }} fill="#E8A020" />
                  ))}
                </div>
                <p className="font-playfair italic text-[16px] leading-[1.7] text-white mb-4">
                  "The demo was incredibly helpful. They understood our challenges immediately and showed us exactly how EduMyles would solve them. We were up and running within a week."
                </p>
                <p className="font-jakarta font-semibold text-[13px]" style={{ color: "#E8A020" }}>
                  Grace Njeri, Finance Officer — Nairobi Green Academy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Contact Section */}
      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[800px] mx-auto text-center">
          <h3
            className="font-playfair font-bold mb-4"
            style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", color: "#061A12" }}
          >
            Prefer to Talk Directly?
          </h3>
          <p className="font-jakarta text-[16px] mb-8" style={{ color: "#5a5a5a" }}>
            Our team is ready to answer your questions and help you get started.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
              <Phone className="w-6 h-6 mb-3" style={{ color: "#0F4C2A" }} />
              <h4 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: "#061A12" }}>
                Call Us
              </h4>
              <p className="font-jakarta text-[14px]" style={{ color: "#5a5a5a" }}>
                +254 700 123 456
              </p>
            </div>
            
            <div className="p-6 rounded-xl" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
              <Mail className="w-6 h-6 mb-3" style={{ color: "#0F4C2A" }} />
              <h4 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: "#061A12" }}>
                Email Us
              </h4>
              <p className="font-jakarta text-[14px]" style={{ color: "#5a5a5a" }}>
                demo@edumyles.com
              </p>
            </div>
            
            <div className="p-6 rounded-xl" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
              <MapPin className="w-6 h-6 mb-3" style={{ color: "#0F4C2A" }} />
              <h4 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: "#061A12" }}>
                Visit Us
              </h4>
              <p className="font-jakarta text-[14px]" style={{ color: "#5a5a5a" }}>
                Nairobi, Kenya
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
