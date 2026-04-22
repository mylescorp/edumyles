"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[15px] outline-none transition-colors duration-200 focus:border-[#061A12]";
const labelClass = "block text-sm font-medium font-jakarta mb-1";

export default function PartnerForm() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [fields, setFields] = useState({
    name: "",
    email: "",
    company: "",
    country: "",
    partnerType: "",
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
          school: fields.company,
          role: fields.partnerType,
          subject: "Partner Application",
          message: `Country: ${fields.country}\nPartner Type: ${fields.partnerType}\nCompany/Organisation: ${fields.company}\n\n${fields.message}`,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setFormState("success");
    } catch {
      setFormState("error");
    }
  };

  if (formState === "success") {
    return (
      <div
        className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
        style={{ background: "#F3FBF6", border: "1px solid #A8E6C3" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "#26A65B", color: "#ffffff" }}
        >
          ✓
        </div>
        <h3 className="font-display font-bold text-[22px]" style={{ color: "#061A12" }}>
          Application received!
        </h3>
        <p className="font-jakarta text-[16px]" style={{ color: "#5a5a5a" }}>
          Our partnerships team will be in touch within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Row: Full Name + Email */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="partner-name" className={labelClass} style={{ color: "#061A12" }}>
            Full Name <span style={{ color: "#E8A020" }}>*</span>
          </label>
          <input
            id="partner-name"
            name="name"
            type="text"
            required
            value={fields.name}
            onChange={handleChange}
            placeholder="e.g. James Otieno"
            className={inputClass}
            style={{ color: "#212121" }}
          />
        </div>
        <div>
          <label htmlFor="partner-email" className={labelClass} style={{ color: "#061A12" }}>
            Email Address <span style={{ color: "#E8A020" }}>*</span>
          </label>
          <input
            id="partner-email"
            name="email"
            type="email"
            required
            value={fields.email}
            onChange={handleChange}
            placeholder="you@company.com"
            className={inputClass}
            style={{ color: "#212121" }}
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label htmlFor="partner-company" className={labelClass} style={{ color: "#061A12" }}>
          Company / Organisation
        </label>
        <input
          id="partner-company"
          name="company"
          type="text"
          value={fields.company}
          onChange={handleChange}
          placeholder="e.g. Apex EdTech Solutions"
          className={inputClass}
          style={{ color: "#212121" }}
        />
      </div>

      {/* Row: Country + Partner Type */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="partner-country" className={labelClass} style={{ color: "#061A12" }}>
            Country <span style={{ color: "#E8A020" }}>*</span>
          </label>
          <select
            id="partner-country"
            name="country"
            required
            value={fields.country}
            onChange={handleChange}
            className={inputClass}
            style={{ color: fields.country ? "#212121" : "#9ca3af" }}
          >
            <option value="">Select country…</option>
            <option value="Kenya">Kenya</option>
            <option value="Uganda">Uganda</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Rwanda">Rwanda</option>
            <option value="Zambia">Zambia</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="partner-type" className={labelClass} style={{ color: "#061A12" }}>
            Partner Type <span style={{ color: "#E8A020" }}>*</span>
          </label>
          <select
            id="partner-type"
            name="partnerType"
            required
            value={fields.partnerType}
            onChange={handleChange}
            className={inputClass}
            style={{ color: fields.partnerType ? "#212121" : "#9ca3af" }}
          >
            <option value="">Select type…</option>
            <option value="Referral Partner">Referral Partner</option>
            <option value="Reseller Partner">Reseller Partner</option>
            <option value="Integration Partner">Integration Partner</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="partner-message" className={labelClass} style={{ color: "#061A12" }}>
          How do you plan to bring schools to EduMyles? <span style={{ color: "#E8A020" }}>*</span>
        </label>
        <textarea
          id="partner-message"
          name="message"
          required
          rows={4}
          value={fields.message}
          onChange={handleChange}
          placeholder="Tell us about your network, approach, and the opportunity you see…"
          className={inputClass}
          style={{ color: "#212121", resize: "vertical" }}
        />
      </div>

      {/* Error state */}
      {formState === "error" && (
        <p className="font-jakarta text-[14px]" style={{ color: "#dc2626" }}>
          Something went wrong. Please try again or email us at{" "}
          <a
            href="mailto:partners@edumyles.com"
            style={{ color: "#dc2626", textDecoration: "underline" }}
          >
            partners@edumyles.com
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
            minWidth: "220px",
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
          {formState === "loading" ? "Submitting…" : "Submit Application →"}
        </button>
      </div>
    </form>
  );
}
