"use client";

import { useState } from "react";
import { trackFormSubmission, trackLeadConversion } from "@/lib/analytics";

type FormState = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[15px] outline-none transition-colors duration-200 focus:border-[#061A12]";
const labelClass = "block text-sm font-medium font-jakarta mb-1";

export default function ContactForm() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [fields, setFields] = useState({
    name: "",
    email: "",
    school: "",
    role: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          school: fields.school,
          role: fields.role,
          subject: fields.subject,
          message: fields.message,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      trackFormSubmission("contact", true);
      trackLeadConversion("contact", { form_name: "contact" });
      setFormState("success");
    } catch {
      trackFormSubmission("contact", false);
      setFormState("error");
    }
  };

  return (
    <section className="py-16 px-4" style={{ background: "#ffffff" }}>
      <div className="max-w-[720px] mx-auto">
        {/* Heading */}
        <div className="mb-8">
          <h2
            className="font-display font-bold leading-[1.2] mb-2"
            style={{ fontSize: "clamp(1.6rem,3vw,2.25rem)", color: "#061A12" }}
          >
            Send Us a{" "}
            <em className="italic" style={{ color: "#E8A020" }}>
              Message
            </em>
          </h2>
          <p className="font-jakarta text-[15px]" style={{ color: "#5a5a5a" }}>
            Fill in the form below and we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        {formState === "success" ? (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
            style={{ background: "#F3FBF6", border: "1px solid #A8E6C3" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "#26A65B", color: "#ffffff" }}
            >
              ✓
            </div>
            <h3 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
              Thank you!
            </h3>
            <p className="font-jakarta text-[15px]" style={{ color: "#5a5a5a" }}>
              We&apos;ll be in touch within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Row: Full Name + Email */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-name" className={labelClass} style={{ color: "#061A12" }}>
                  Full Name <span style={{ color: "#E8A020" }}>*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  value={fields.name}
                  onChange={handleChange}
                  placeholder="e.g. Mary Kamau"
                  className={inputClass}
                  style={{ color: "#212121" }}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={labelClass} style={{ color: "#061A12" }}>
                  Email Address <span style={{ color: "#E8A020" }}>*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  value={fields.email}
                  onChange={handleChange}
                  placeholder="you@school.ac.ke"
                  className={inputClass}
                  style={{ color: "#212121" }}
                />
              </div>
            </div>

            {/* Row: School Name + Role */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-school" className={labelClass} style={{ color: "#061A12" }}>
                  School Name
                </label>
                <input
                  id="contact-school"
                  name="school"
                  type="text"
                  value={fields.school}
                  onChange={handleChange}
                  placeholder="e.g. Nairobi Green Academy"
                  className={inputClass}
                  style={{ color: "#212121" }}
                />
              </div>
              <div>
                <label htmlFor="contact-role" className={labelClass} style={{ color: "#061A12" }}>
                  Your Role
                </label>
                <select
                  id="contact-role"
                  name="role"
                  value={fields.role}
                  onChange={handleChange}
                  className={inputClass}
                  style={{ color: fields.role ? "#212121" : "#9ca3af" }}
                >
                  <option value="">Select your role…</option>
                  <option value="Principal / Head Teacher">Principal / Head Teacher</option>
                  <option value="Bursar / Finance Officer">Bursar / Finance Officer</option>
                  <option value="IT Administrator">IT Administrator</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Parent">Parent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="contact-subject" className={labelClass} style={{ color: "#061A12" }}>
                Subject
              </label>
              <select
                id="contact-subject"
                name="subject"
                value={fields.subject}
                onChange={handleChange}
                className={inputClass}
                style={{ color: fields.subject ? "#212121" : "#9ca3af" }}
              >
                <option value="">Select a subject…</option>
                <option value="General Enquiry">General Enquiry</option>
                <option value="Book a Demo">Book a Demo</option>
                <option value="Pricing & Plans">Pricing &amp; Plans</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Partnership">Partnership</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="contact-message" className={labelClass} style={{ color: "#061A12" }}>
                Message <span style={{ color: "#E8A020" }}>*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={4}
                value={fields.message}
                onChange={handleChange}
                placeholder="Tell us how we can help…"
                className={inputClass}
                style={{ color: "#212121", resize: "vertical" }}
              />
            </div>

            {/* Error state */}
            {formState === "error" && (
              <p className="font-jakarta text-[14px]" style={{ color: "#dc2626" }}>
                Something went wrong. Please try again or email us directly at{" "}
                <a
                  href="mailto:contact@edumyles.com"
                  style={{ color: "#dc2626", textDecoration: "underline" }}
                >
                  contact@edumyles.com
                </a>
                .
              </p>
            )}

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={formState === "loading"}
                className="inline-flex items-center justify-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] transition-colors duration-200"
                style={{
                  background: formState === "loading" ? "#5a5a5a" : "#061A12",
                  color: "#ffffff",
                  cursor: formState === "loading" ? "not-allowed" : "pointer",
                  border: "none",
                  minWidth: "180px",
                }}
                onMouseEnter={(e) => {
                  if (formState !== "loading") {
                    e.currentTarget.style.background = "#E8A020";
                    e.currentTarget.style.color = "#061A12";
                  }
                }}
                onMouseLeave={(e) => {
                  if (formState !== "loading") {
                    e.currentTarget.style.background = "#061A12";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
              >
                {formState === "loading" ? "Sending…" : "Send Message →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
