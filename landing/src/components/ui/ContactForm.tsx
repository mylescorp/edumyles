"use client";

import { useState } from "react";
import { trackFormSubmission, trackLeadConversion } from "@/lib/analytics";

type FormState = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full border border-border bg-background rounded-lg px-4 py-3 font-jakarta text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors duration-200 focus:border-primary";
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
    <section className="py-16 px-4" style={{ background: "var(--card)" }}>
      <div className="max-w-[720px] mx-auto">
        {/* Heading */}
        <div className="mb-8">
          <h2
            className="font-display font-bold leading-[1.2] mb-2"
            style={{ fontSize: "clamp(1.6rem,3vw,2.25rem)", color: "var(--foreground)" }}
          >
            Send Us a{" "}
            <em className="italic" style={{ color: "var(--accent-foreground)" }}>
              Message
            </em>
          </h2>
          <p className="font-jakarta text-[15px]" style={{ color: "var(--muted-foreground)" }}>
            Fill in the form below and we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        {formState === "success" ? (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "var(--success)", color: "var(--success-foreground)" }}
            >
              ✓
            </div>
            <h3 className="font-display font-bold text-[22px]" style={{ color: "var(--foreground)" }}>
              Thank you!
            </h3>
            <p className="font-jakarta text-[15px]" style={{ color: "var(--muted-foreground)" }}>
              We&apos;ll be in touch within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Row: Full Name + Email */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-name" className={labelClass} style={{ color: "var(--foreground)" }}>
                  Full Name <span style={{ color: "var(--accent-foreground)" }}>*</span>
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
                  style={{ color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={labelClass} style={{ color: "var(--foreground)" }}>
                  Email Address <span style={{ color: "var(--accent-foreground)" }}>*</span>
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
                  style={{ color: "var(--foreground)" }}
                />
              </div>
            </div>

            {/* Row: School Name + Role */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-school" className={labelClass} style={{ color: "var(--foreground)" }}>
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
                  style={{ color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label htmlFor="contact-role" className={labelClass} style={{ color: "var(--foreground)" }}>
                  Your Role
                </label>
                <select
                  id="contact-role"
                  name="role"
                  value={fields.role}
                  onChange={handleChange}
                  className={inputClass}
                  style={{ color: fields.role ? "var(--foreground)" : "var(--muted-foreground)" }}
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
              <label htmlFor="contact-subject" className={labelClass} style={{ color: "var(--foreground)" }}>
                Subject
              </label>
              <select
                id="contact-subject"
                name="subject"
                value={fields.subject}
                onChange={handleChange}
                className={inputClass}
                style={{ color: fields.subject ? "var(--foreground)" : "var(--muted-foreground)" }}
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
              <label htmlFor="contact-message" className={labelClass} style={{ color: "var(--foreground)" }}>
                Message <span style={{ color: "var(--accent-foreground)" }}>*</span>
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
                style={{ color: "var(--foreground)", resize: "vertical" }}
              />
            </div>

            {/* Error state */}
            {formState === "error" && (
              <p className="font-jakarta text-[14px]" style={{ color: "var(--danger)" }}>
                Something went wrong. Please try again or email us directly at{" "}
                <a
                  href="mailto:contact@edumyles.com"
                  style={{ color: "var(--danger)", textDecoration: "underline" }}
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
                  background: formState === "loading" ? "var(--muted-foreground)" : "var(--primary)",
                  color: "var(--primary-foreground)",
                  cursor: formState === "loading" ? "not-allowed" : "pointer",
                  border: "none",
                  minWidth: "180px",
                }}
                onMouseEnter={(e) => {
                  if (formState !== "loading") {
                    e.currentTarget.style.background = "var(--primary)";
                    e.currentTarget.style.color = "var(--primary-foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (formState !== "loading") {
                    e.currentTarget.style.background = "var(--primary)";
                    e.currentTarget.style.color = "var(--primary-foreground)";
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
