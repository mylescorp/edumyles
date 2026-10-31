import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Mail,
  Wrench,
  MessageCircle,
  Phone,
  Rocket,
  CalendarDays,
  Briefcase,
  MapPin,
  Clock,
  Globe,
  Map,
} from "lucide-react";
import ContactForm from "@/components/ui/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — EduMyles",
  description:
    "Get in touch with EduMyles. Start your free trial, book a demo, or reach our sales and support teams. Based in Nairobi, Kenya.",
};

const contactChannels: {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  desc: string;
}[] = [
  {
    icon: Mail,
    label: "Sales",
    value: "sales@edumyles.com",
    href: "mailto:sales@edumyles.com",
    desc: "Pricing, plans, and enterprise enquiries",
  },
  {
    icon: Wrench,
    label: "Support",
    value: "support@edumyles.com",
    href: "mailto:support@edumyles.com",
    desc: "Technical help for existing customers",
  },
  {
    icon: MessageCircle,
    label: "General",
    value: "contact@edumyles.com",
    href: "mailto:contact@edumyles.com",
    desc: "General questions, press, partnerships",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+254 743 993 715",
    href: "tel:+254743993715",
    desc: "Mon–Fri, 8 am – 6 pm EAT",
  },
];

const options: {
  icon: LucideIcon;
  title: string;
  desc: string;
  bullets: string[];
  cta: string;
  href: string;
  primary: boolean;
}[] = [
  {
    icon: Rocket,
    title: "Start Free Trial",
    desc: "Get full access to EduMyles for free — no credit card, no commitment. Set your school up in under an hour.",
    bullets: [
      "30 days completely free",
      "No credit card required",
      "Free onboarding support",
      "Cancel anytime",
    ],
    cta: "Activate Free Trial",
    href: "/waitlist",
    primary: true,
  },
  {
    icon: CalendarDays,
    title: "Book a Demo",
    desc: "See EduMyles in action with a personalised walkthrough from our school-tech team. Not a sales pitch — a genuine consultation.",
    bullets: [
      "45-minute live demo",
      "Tailored to your school type",
      "Q&A session included",
      "No obligation",
    ],
    cta: "Book Consultation",
    href: "mailto:contact@edumyles.com?subject=Demo%20Request&body=Hi%20EduMyles%20Team%2C%0A%0AI%27d%20like%20to%20book%20a%20demo.%0A%0ASchool%20Name%3A%20%0ALocation%3A%20%0ANumber%20of%20Students%3A%20%0AContact%20Person%3A%20%0APreferred%20time%3A%20%0A%0AThank%20you!",
    primary: false,
  },
  {
    icon: Briefcase,
    title: "Talk to Sales",
    desc: "Questions about pricing, enterprise plans, multi-campus deals, or the partner programme? Our sales team can help.",
    bullets: [
      "Custom pricing available",
      "Multi-campus discounts",
      "Partner programme",
      "NGO / government rates",
    ],
    cta: "Email Sales",
    href: "mailto:sales@edumyles.com?subject=Sales%20Enquiry",
    primary: false,
  },
];

const faqs = [
  {
    q: "How quickly can we get started?",
    a: "Same day. Sign up, create your school profile, and you're live. Our onboarding team will reach out within 24 hours to schedule your free setup session.",
  },
  {
    q: "Do you support schools outside Kenya?",
    a: "Yes — we serve schools in Uganda, Tanzania, Rwanda, and beyond. Payment integrations vary by country. Contact us for details on your region.",
  },
  {
    q: "Can you migrate our existing data?",
    a: "Yes. We offer data migration support for schools moving from Excel, other SMS, or legacy systems. Ask about this during your demo.",
  },
  {
    q: "Do you offer training?",
    a: "All plans include a free onboarding session. Professional and Enterprise plans include extended staff training. On-site training is available for Enterprise.",
  },
];

export default function ContactPage() {
  return (
    <div style={{ color: "var(--foreground)" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--card)",
          borderTop: "3px solid var(--primary)",
          padding: "6rem 2rem 5rem",
          minHeight: "400px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,rgb(var(--primary-rgb) / 4%) 25%,rgb(var(--primary-rgb) / 4%) 26%,transparent 27%,transparent 74%,rgb(var(--primary-rgb) / 4%) 75%,rgb(var(--primary-rgb) / 4%) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgb(var(--primary-rgb) / 4%) 25%,rgb(var(--primary-rgb) / 4%) 26%,transparent 27%,transparent 74%,rgb(var(--primary-rgb) / 4%) 75%,rgb(var(--primary-rgb) / 4%) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{
              background: "rgb(var(--primary-rgb) / 12%)",
              border: "1px solid var(--accent-foreground)",
              color: "var(--accent-foreground)",
            }}
          >
            Get in Touch
          </div>
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "var(--foreground)" }}
          >
            Let&apos;s get your school{" "}
            <em className="italic" style={{ color: "var(--accent-foreground)" }}>
              running on EduMyles.
            </em>
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mx-auto"
            style={{ fontSize: "18px", color: "var(--muted-foreground)", maxWidth: "560px" }}
          >
            Whether you want to start a free trial, book a demo, or just ask a question — our team
            is ready.
          </p>
        </div>
      </section>

      {/* ── 3 Option Cards ────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--background)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {options.map((opt) => (
              <div
                key={opt.title}
                className="rounded-2xl p-7 flex flex-col gap-4"
                style={{
                  background: opt.primary ? "var(--primary)" : "var(--card)",
                  border: opt.primary ? "2px solid var(--primary)" : "1px solid var(--border)",
                  boxShadow: opt.primary
                    ? "0 16px 48px rgba(6,26,18,0.25)"
                    : "0 4px 16px rgba(6,26,18,0.06)",
                }}
              >
                <div style={{ color: opt.primary ? "var(--primary-foreground)" : "var(--primary)" }}>
                  <opt.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3
                  className="font-display font-bold text-[22px]"
                  style={{ color: opt.primary ? "var(--primary-foreground)" : "var(--foreground)" }}
                >
                  {opt.title}
                </h3>
                <p
                  className="font-jakarta text-[14px] leading-[1.7]"
                  style={{ color: opt.primary ? "var(--primary-foreground)" : "var(--muted-foreground)", opacity: opt.primary ? 0.84 : 1 }}
                >
                  {opt.desc}
                </p>
                <ul className="flex flex-col gap-2 flex-1">
                  {opt.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 font-jakarta text-[13px]"
                      style={{ color: opt.primary ? "var(--primary-foreground)" : "var(--foreground)" }}
                    >
                      <span style={{ color: "#26A65B", fontWeight: 700, flexShrink: 0 }}>✓</span>{" "}
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href={opt.href}
                  className="block text-center font-jakarta font-bold text-[15px] py-3.5 rounded-[50px] no-underline mt-2 transition-all duration-200"
                  style={
                    opt.primary
                      ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                      : { background: "var(--primary)", color: "var(--primary-foreground)" }
                  }
                >
                  {opt.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form ──────────────────────────────────── */}
      <ContactForm />

      {/* ── WhatsApp Quick Contact ─────────────────────────── */}
      <section className="py-14 px-4" style={{ background: "var(--card)" }}>
        <div className="max-w-[860px] mx-auto">
          <div
            className="rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
              boxShadow: "0 8px 32px rgba(6,26,18,0.2)",
            }}
          >
            <div style={{ color: "var(--primary-foreground)" }}>
              <MessageCircle className="w-12 h-12" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display font-bold text-[24px] mb-2" style={{ color: "var(--primary-foreground)" }}>
                Chat with us on WhatsApp
              </h3>
              <p className="font-jakarta text-[15px] leading-[1.7]" style={{ color: "var(--primary-foreground)", opacity: 0.84 }}>
                Get a quick answer from our team — usually within minutes during business hours.
              </p>
            </div>
            <a
              href="https://wa.me/254743993715?text=Hi%20EduMyles%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20school%20management%20system."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-7 py-3.5 rounded-[50px] no-underline flex-shrink-0"
              style={{ background: "#25D366", color: "#052E16" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact Info + Office ──────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--background)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Contact channels */}
            <div>
              <h2 className="font-display font-bold text-[28px] mb-8" style={{ color: "var(--foreground)" }}>
                Contact{" "}
                <em className="italic" style={{ color: "var(--accent-foreground)" }}>
                  Information
                </em>
              </h2>
              <div className="flex flex-col gap-4">
                {contactChannels.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    className="flex items-start gap-4 p-5 rounded-2xl no-underline transition-all duration-200 group"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(38,166,91,0.1)", color: "var(--primary)" }}
                    >
                      <c.icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div
                        className="font-jakarta font-bold text-[13px] mb-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {c.label}
                      </div>
                      <div
                        className="font-jakarta font-semibold text-[15px] mb-0.5 group-hover:text-[var(--accent-foreground)] transition-colors"
                        style={{ color: "var(--foreground)" }}
                      >
                        {c.value}
                      </div>
                      <div className="font-jakarta text-[13px]" style={{ color: "#8a8a8a" }}>
                        {c.desc}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Office */}
            <div>
              <h2 className="font-display font-bold text-[28px] mb-8" style={{ color: "var(--foreground)" }}>
                Our{" "}
                <em className="italic" style={{ color: "var(--accent-foreground)" }}>
                  Office
                </em>
              </h2>
              <div
                className="rounded-2xl p-7"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 16px rgba(6,26,18,0.06)",
                }}
              >
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-3">
                    <span style={{ color: "var(--primary)", marginTop: "2px" }}>
                      <MapPin className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <div>
                      <div
                        className="font-jakarta font-bold text-[15px] mb-0.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        WesternHeights
                      </div>
                      <div className="font-jakarta text-[14px]" style={{ color: "var(--muted-foreground)" }}>
                        Nairobi, Kenya
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span style={{ color: "var(--primary)", marginTop: "2px" }}>
                      <Clock className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <div>
                      <div
                        className="font-jakarta font-bold text-[15px] mb-0.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        Business Hours
                      </div>
                      <div className="font-jakarta text-[14px]" style={{ color: "var(--muted-foreground)" }}>
                        Monday – Friday: 8:00 AM – 6:00 PM EAT
                      </div>
                      <div className="font-jakarta text-[14px]" style={{ color: "var(--muted-foreground)" }}>
                        Saturday: 9:00 AM – 1:00 PM EAT
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span style={{ color: "var(--primary)", marginTop: "2px" }}>
                      <Globe className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <div>
                      <div
                        className="font-jakarta font-bold text-[15px] mb-0.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        Service Area
                      </div>
                      <div className="font-jakarta text-[14px]" style={{ color: "var(--muted-foreground)" }}>
                        Kenya · Uganda · Tanzania · Rwanda · Zambia
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map placeholder */}
                <div
                  className="mt-6 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--background)", border: "1px dashed var(--primary)", height: "160px" }}
                >
                  <div className="text-center flex flex-col items-center gap-2">
                    <Map className="w-12 h-12" strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                    <p className="font-jakarta text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                      Nairobi, Kenya
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "var(--card)" }}>
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-10">
            <h2
              className="font-display font-bold leading-[1.2]"
              style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "var(--foreground)" }}
            >
              Common{" "}
              <em className="italic" style={{ color: "var(--accent-foreground)" }}>
                questions
              </em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl p-6"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="font-display font-bold text-[17px] mb-2"
                  style={{ color: "var(--foreground)" }}
                >
                  {faq.q}
                </h3>
                <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "var(--muted-foreground)" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--primary)" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-display font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "var(--primary-foreground)" }}
          >
            Ready to transform{" "}
            <em className="italic" style={{ color: "var(--primary-foreground)" }}>
              your school?
            </em>
          </h2>
          <p className="font-jakarta text-[17px] leading-[1.7] mb-8" style={{ color: "var(--primary-foreground)" }}>
            Start your free 30-day trial today. No credit card. No setup fees. Full support from day
            one.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/waitlist"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "var(--primary-foreground)", color: "var(--primary)" }}
            >
              Start Free Trial →
            </a>
            <a
              href="tel:+254743993715"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{
                background: "transparent",
                border: "2px solid rgb(var(--primary-foreground-rgb) / 45%)",
                color: "var(--primary-foreground)",
              }}
            >
              Call Us Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
