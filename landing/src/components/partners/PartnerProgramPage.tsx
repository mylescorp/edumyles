import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Coins,
  FileCode2,
  GraduationCap,
  Handshake,
  Headphones,
  Layers3,
  LineChart,
  Link2,
  Megaphone,
  MessageCircle,
  MonitorCheck,
  Network,
  PackageCheck,
  Plug,
  Route,
  School,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
  Wrench,
} from "lucide-react";

type Highlight = {
  label: string;
  value: string;
};

type IconText = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type Tier = {
  title: string;
  label: string;
  body: string;
  points: string[];
};

type Step = {
  title: string;
  body: string;
};

type Faq = {
  q: string;
  a: string;
};

export type PartnerProgramConfig = {
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  heroIcon: LucideIcon;
  proof: Highlight[];
  dashboardTitle: string;
  dashboardKpis: Highlight[];
  dashboardRows: string[];
  fitTitle: string;
  fitIntro: string;
  fits: IconText[];
  benefitsTitle: string;
  benefitsIntro: string;
  benefits: IconText[];
  tiersTitle: string;
  tiersIntro: string;
  tiers: Tier[];
  processTitle: string;
  processIntro: string;
  steps: Step[];
  toolkitTitle: string;
  toolkitIntro: string;
  toolkit: string[];
  faqTitle: string;
  faqs: Faq[];
  finalTitle: string;
  finalBody: string;
};

function SectionHeader({
  label,
  title,
  body,
  center = false,
  tone = "light",
}: {
  label: string;
  title: string;
  body: string;
  center?: boolean;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div className={center ? "mx-auto mb-12 max-w-[760px] text-center" : "mb-10 max-w-[760px]"}>
      <div
        className="mb-4 inline-flex items-center gap-2 rounded-[8px] px-3 py-2 font-jakarta text-[11px] font-bold uppercase tracking-[0.16em]"
        style={{ background: "rgba(232,160,32,0.12)", color: "#9A5D00" }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#E8A020" }} />
        {label}
      </div>
      <h2
        className="font-display font-bold leading-[1.12]"
        style={{ color: isDark ? "#ffffff" : "#061A12", fontSize: "clamp(1.9rem,3.8vw,3.15rem)" }}
      >
        {title}
      </h2>
      <p className="mt-4 font-jakarta text-[16px] leading-8" style={{ color: isDark ? "#A8E6C3" : "#53665b" }}>
        {body}
      </p>
    </div>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "dark" | "light";
}) {
  const styles =
    variant === "primary"
      ? { background: "#E8A020", color: "#061A12", border: "1px solid #E8A020" }
      : variant === "dark"
        ? { background: "#061A12", color: "#ffffff", border: "1px solid #061A12" }
        : { background: "rgba(255,255,255,0.06)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.24)" };

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-[8px] px-5 py-3 font-jakarta text-[14px] font-bold no-underline transition-transform duration-200 hover:-translate-y-0.5"
      style={styles}
    >
      {children}
      <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
    </Link>
  );
}

function ProgramDashboard({ config }: { config: PartnerProgramConfig }) {
  return (
    <div
      className="relative overflow-hidden rounded-[8px] border p-5 shadow-2xl"
      style={{ background: "#F8FCFA", borderColor: "rgba(168,230,195,0.42)" }}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6B9E83" }}>
            Partner Console
          </p>
          <h3 className="mt-1 font-display text-[22px] font-bold" style={{ color: "#061A12" }}>
            {config.dashboardTitle}
          </h3>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-[8px]"
          style={{ background: "#061A12", color: "#E8A020" }}
        >
          <config.heroIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {config.dashboardKpis.map((kpi) => (
          <div key={kpi.label} className="rounded-[8px] border bg-white p-3" style={{ borderColor: "#d7eadf" }}>
            <p className="font-jakarta text-[11px] font-semibold" style={{ color: "#6B9E83" }}>
              {kpi.label}
            </p>
            <p className="mt-1 font-display text-[19px] font-bold" style={{ color: "#061A12" }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {config.dashboardRows.map((row, index) => (
          <div
            key={row}
            className="flex items-center justify-between gap-3 rounded-[8px] border bg-white px-4 py-3"
            style={{ borderColor: index === 0 ? "rgba(232,160,32,0.48)" : "#d7eadf" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-[8px]"
                style={{ background: index === 0 ? "rgba(232,160,32,0.14)" : "#EEF6F1" }}
              >
                <CheckCircle2 className="h-4 w-4" style={{ color: index === 0 ? "#E8A020" : "#1A7A4A" }} />
              </span>
              <span className="font-jakarta text-[13px] font-semibold" style={{ color: "#243d31" }}>
                {row}
              </span>
            </div>
            <span className="h-2 w-16 rounded-full" style={{ background: index === 0 ? "#E8A020" : "#A8E6C3" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PartnerProgramPage({ config }: { config: PartnerProgramConfig }) {
  return (
    <main style={{ color: "#212121", background: "#ffffff" }}>
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-8 lg:py-24"
        style={{ background: "#061A12", borderTop: "3px solid #E8A020" }}
      >
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "linear-gradient(135deg, rgba(26,122,74,0.34), transparent 45%), radial-gradient(circle at 78% 18%, rgba(232,160,32,0.16), transparent 28%)",
          }}
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-[8px] border px-4 py-2 font-jakarta text-[12px] font-bold uppercase tracking-[0.18em]"
              style={{ borderColor: "rgba(232,160,32,0.42)", color: "#E8A020", background: "rgba(232,160,32,0.1)" }}
            >
              <Sparkles className="h-4 w-4" />
              {config.eyebrow}
            </div>
            <h1
              className="font-display font-bold leading-[0.98]"
              style={{ color: "#ffffff", fontSize: "clamp(2.75rem,7vw,5.5rem)" }}
            >
              {config.title} <span style={{ color: "#E8A020" }}>{config.accent}</span>
            </h1>
            <p className="mt-7 max-w-[680px] font-jakarta text-[18px] leading-8" style={{ color: "#CDEEDD" }}>
              {config.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={config.primaryHref}>{config.primaryCta}</ButtonLink>
              <ButtonLink href={config.secondaryHref} variant="light">
                {config.secondaryCta}
              </ButtonLink>
            </div>
            <div className="mt-10 grid max-w-[680px] grid-cols-2 gap-3 sm:grid-cols-4">
              {config.proof.map((item) => (
                <div key={item.label} className="rounded-[8px] border p-4" style={{ borderColor: "rgba(168,230,195,0.18)", background: "rgba(255,255,255,0.04)" }}>
                  <p className="font-display text-[24px] font-bold" style={{ color: "#ffffff" }}>
                    {item.value}
                  </p>
                  <p className="mt-1 font-jakarta text-[12px] leading-5" style={{ color: "#A8E6C3" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <ProgramDashboard config={config} />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader label="Who It Fits" title={config.fitTitle} body={config.fitIntro} center />
          <div className="grid gap-4 md:grid-cols-3">
            {config.fits.map((item) => (
              <div key={item.title} className="rounded-[8px] border p-6" style={{ borderColor: "#d7eadf", background: "#F8FCFA" }}>
                <item.icon className="h-7 w-7" style={{ color: "#1A7A4A" }} />
                <h3 className="mt-5 font-display text-[20px] font-bold" style={{ color: "#061A12" }}>
                  {item.title}
                </h3>
                <p className="mt-3 font-jakarta text-[14px] leading-7" style={{ color: "#53665b" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8" style={{ background: "#EEF6F1" }}>
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader label="Why Join" title={config.benefitsTitle} body={config.benefitsIntro} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {config.benefits.map((item) => (
              <div key={item.title} className="rounded-[8px] border bg-white p-6" style={{ borderColor: "#d7eadf" }}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]" style={{ background: "rgba(232,160,32,0.12)" }}>
                    <item.icon className="h-5 w-5" style={{ color: "#9A5D00" }} />
                  </span>
                  <div>
                    <h3 className="font-jakarta text-[16px] font-bold" style={{ color: "#061A12" }}>
                      {item.title}
                    </h3>
                    <p className="mt-2 font-jakarta text-[13.5px] leading-7" style={{ color: "#53665b" }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader label="Program Model" title={config.tiersTitle} body={config.tiersIntro} center />
          <div className="grid gap-5 lg:grid-cols-3">
            {config.tiers.map((tier, index) => (
              <div
                key={tier.title}
                className="rounded-[8px] border p-7"
                style={{
                  background: index === 1 ? "#061A12" : "#ffffff",
                  borderColor: index === 1 ? "#E8A020" : "#d7eadf",
                  color: index === 1 ? "#ffffff" : "#061A12",
                }}
              >
                <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: index === 1 ? "#E8A020" : "#6B9E83" }}>
                  {tier.label}
                </p>
                <h3 className="mt-3 font-display text-[24px] font-bold">{tier.title}</h3>
                <p className="mt-3 font-jakarta text-[14px] leading-7" style={{ color: index === 1 ? "#CDEEDD" : "#53665b" }}>
                  {tier.body}
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 font-jakarta text-[13.5px] leading-6" style={{ listStyle: "none", color: index === 1 ? "#ffffff" : "#243d31" }}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#E8A020" }} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8" style={{ background: "#061A12" }}>
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeader label="Launch Plan" title={config.processTitle} body={config.processIntro} tone="dark" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {config.steps.map((step, index) => (
              <div key={step.title} className="rounded-[8px] border p-6" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(168,230,195,0.16)" }}>
                <span className="font-display text-[28px] font-bold" style={{ color: "#E8A020" }}>
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-display text-[21px] font-bold" style={{ color: "#ffffff" }}>
                  {step.title}
                </h3>
                <p className="mt-3 font-jakarta text-[14px] leading-7" style={{ color: "#A8E6C3" }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8" style={{ background: "#F8FCFA" }}>
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader label="Included" title={config.toolkitTitle} body={config.toolkitIntro} />
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={config.primaryHref}>{config.primaryCta}</ButtonLink>
              <ButtonLink href="/contact" variant="dark">
                Talk to partnerships
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.toolkit.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[8px] border bg-white p-4" style={{ borderColor: "#d7eadf" }}>
                <PackageCheck className="h-5 w-5 shrink-0" style={{ color: "#1A7A4A" }} />
                <span className="font-jakarta text-[14px] font-semibold" style={{ color: "#243d31" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-[900px]">
          <SectionHeader label="FAQ" title={config.faqTitle} body="Straight answers before you apply." center />
          <div className="space-y-3">
            {config.faqs.map((faq) => (
              <details key={faq.q} className="rounded-[8px] border p-5" style={{ borderColor: "#d7eadf", background: "#F8FCFA" }}>
                <summary className="cursor-pointer font-jakarta text-[15px] font-bold" style={{ color: "#061A12" }}>
                  {faq.q}
                </summary>
                <p className="mt-3 font-jakarta text-[14px] leading-7" style={{ color: "#53665b" }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-8" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-[1200px] rounded-[8px] p-8 text-center sm:p-12" style={{ background: "#061A12" }}>
          <h2 className="font-display font-bold leading-tight" style={{ color: "#ffffff", fontSize: "clamp(2rem,4vw,3.25rem)" }}>
            {config.finalTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] font-jakarta text-[16px] leading-8" style={{ color: "#CDEEDD" }}>
            {config.finalBody}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={config.primaryHref}>{config.primaryCta}</ButtonLink>
            <ButtonLink href="/partners" variant="light">
              View all partner paths
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}

export const developerProgram: PartnerProgramConfig = {
  eyebrow: "Developer Ecosystem",
  title: "Build modules schools",
  accent: "can trust",
  intro:
    "Create integrations, curriculum tools, analytics, and workflow extensions for the EduMyles school operating system. We give qualified builders the context, sandbox, APIs, review process, and distribution path needed to ship useful school software without starting from zero.",
  primaryCta: "Apply as developer",
  primaryHref: "/apply/developer",
  secondaryCta: "Explore platform",
  secondaryHref: "/features",
  heroIcon: Code2,
  proof: [
    { value: "13", label: "core school modules" },
    { value: "14", label: "role-aware user types" },
    { value: "API", label: "integration-first roadmap" },
    { value: "EA", label: "East African school focus" },
  ],
  dashboardTitle: "Module Review Pipeline",
  dashboardKpis: [
    { label: "Sandbox", value: "Ready" },
    { label: "Review SLA", value: "7d" },
    { label: "Listings", value: "Curated" },
  ],
  dashboardRows: ["Fee statement connector", "CBC assessment widget", "Transport route optimizer", "Library barcode workflow"],
  fitTitle: "For builders who understand real school workflows",
  fitIntro:
    "The best EduMyles developer partners solve operational problems schools already feel every week: payments, assessment, attendance, reporting, compliance, parent communication, transport, and integrations.",
  fits: [
    {
      icon: FileCode2,
      title: "SaaS and API teams",
      body: "Connect complementary products such as SMS, LMS, accounting, payments, identity, BI, and content platforms into EduMyles workflows.",
    },
    {
      icon: GraduationCap,
      title: "Education product builders",
      body: "Package curriculum, assessment, library, admissions, parent engagement, or school improvement tools for a ready education audience.",
    },
    {
      icon: BriefcaseBusiness,
      title: "Implementation engineers",
      body: "Build bespoke automations and school-specific extensions for groups, international schools, and complex rollouts.",
    },
  ],
  benefitsTitle: "A clearer route from useful code to school adoption",
  benefitsIntro:
    "EduMyles developer partners get a technical path and a commercial path. The goal is not a random app marketplace; it is a reviewed ecosystem schools can safely adopt.",
  benefits: [
    { icon: Plug, title: "Integration patterns", body: "Work with documented use cases around students, finance, admissions, timetable, academics, HR, communications, and reporting." },
    { icon: ShieldCheck, title: "Security review", body: "Ship through a review process that checks data boundaries, school safety, role access, and operational risk." },
    { icon: Boxes, title: "Marketplace positioning", body: "Qualified modules can be packaged as add-ons, implementation assets, or partner-led services." },
    { icon: MonitorCheck, title: "Sandbox access", body: "Test against representative school workflows before touching production customers." },
    { icon: Headphones, title: "Partner support", body: "Get product context, technical review feedback, and launch coordination for strong-fit solutions." },
    { icon: LineChart, title: "Commercial upside", body: "Create distribution through referrals, co-sell motions, revenue share, or paid implementation scopes." },
  ],
  tiersTitle: "Three ways developers can partner",
  tiersIntro:
    "Choose the model that matches your product maturity. A small integration, a packaged module, and a custom implementation service should not be forced through the same door.",
  tiers: [
    {
      label: "Integration",
      title: "Connector Partner",
      body: "Best for products that need reliable data exchange with EduMyles.",
      points: ["API and webhook scoping", "Sandbox validation", "Joint integration notes", "Referral path for mutual customers"],
    },
    {
      label: "Marketplace",
      title: "Module Partner",
      body: "Best for repeatable tools that can be offered to many schools.",
      points: ["Module packaging guidance", "Quality and security review", "Listing and launch support", "Revenue-share discussion"],
    },
    {
      label: "Services",
      title: "Implementation Partner",
      body: "Best for teams delivering custom automations and rollout support.",
      points: ["Solution architecture support", "School workflow discovery", "Delivery playbooks", "Complex account co-sell"],
    },
  ],
  processTitle: "How a developer partnership launches",
  processIntro:
    "We qualify fit first, then move through a technical path that protects schools and gives builders enough context to produce something useful.",
  steps: [
    { title: "Apply with your concept", body: "Share your product, target schools, integration needs, and the problem you solve." },
    { title: "Scope the workflow", body: "We align on data access, roles, success criteria, and whether the best path is API, module, or services." },
    { title: "Build in sandbox", body: "Your team develops against a safe environment with review checkpoints and launch guidance." },
    { title: "Review and launch", body: "Approved work moves into listing, co-sell, pilot, or implementation depending on the partnership model." },
  ],
  toolkitTitle: "Developer partner kit",
  toolkitIntro:
    "Approved partners receive the assets needed to move from idea to pilot without guessing how schools operate.",
  toolkit: ["API and data model orientation", "Sandbox workspace", "Security checklist", "Module launch template", "Pilot school criteria", "Co-marketing outline", "Support escalation path", "Commercial model review"],
  faqTitle: "Developer Questions",
  faqs: [
    { q: "Do I need an existing product?", a: "No. Existing products, prototypes, and implementation teams can apply. What matters is a clear school problem and the ability to build responsibly." },
    { q: "Can I access production school data?", a: "No during early development. Developer work starts in scoped sandbox or pilot environments, with production access only through approved customer and security processes." },
    { q: "Is there a public API?", a: "The partner path is curated. Apply with your use case so we can provide the right API, webhook, or implementation route." },
    { q: "Can developers earn revenue?", a: "Yes, depending on the model. Revenue share, referral, co-sell, and paid implementation structures are discussed after qualification." },
  ],
  finalTitle: "Bring a school workflow into the EduMyles ecosystem.",
  finalBody:
    "If your product can help schools run cleaner operations, make better decisions, or reduce admin work, the developer program is the right place to start.",
};

export const affiliateProgram: PartnerProgramConfig = {
  eyebrow: "Affiliate Program",
  title: "Refer schools and",
  accent: "earn monthly",
  intro:
    "The affiliate program is built for educators, creators, consultants, alumni networks, and community leaders who can introduce EduMyles to schools. Share tracked referrals, help the right schools discover the platform, and earn commission when they subscribe.",
  primaryCta: "Apply as affiliate",
  primaryHref: "/apply/affiliate",
  secondaryCta: "See pricing",
  secondaryHref: "/pricing",
  heroIcon: Share2,
  proof: [
    { value: "10%", label: "subscription commission" },
    { value: "30d", label: "referral tracking window" },
    { value: "KES", label: "local payout support" },
    { value: "0", label: "inventory or setup cost" },
  ],
  dashboardTitle: "Referral Growth Board",
  dashboardKpis: [
    { label: "Clicks", value: "Tracked" },
    { label: "Leads", value: "Live" },
    { label: "Payouts", value: "Monthly" },
  ],
  dashboardRows: ["Warm principal introduction", "WhatsApp school group referral", "CBC guide download", "Demo booked from tracked link"],
  fitTitle: "For people with trusted education audiences",
  fitIntro:
    "Affiliates do not need to implement software or run sales cycles. The strongest affiliates are people whose recommendations already carry trust with schools and parents.",
  fits: [
    { icon: Users, title: "Educators and alumni", body: "Refer schools through your professional network, old school communities, associations, and WhatsApp groups." },
    { icon: Megaphone, title: "Creators and publishers", body: "Share EduMyles through blogs, newsletters, YouTube, TikTok, LinkedIn, webinars, or school-focused content." },
    { icon: Handshake, title: "Consultants and advisors", body: "Recommend EduMyles when schools ask for a better way to manage fees, academics, communication, or reporting." },
  ],
  benefitsTitle: "A lightweight way to earn from trusted introductions",
  benefitsIntro:
    "The affiliate path keeps the work simple: you create awareness, EduMyles handles demos and onboarding, and your referral activity is tracked.",
  benefits: [
    { icon: Link2, title: "Unique referral link", body: "Each approved affiliate receives trackable links and campaign source guidance." },
    { icon: WalletCards, title: "Monthly payouts", body: "Commissions are reviewed and paid on a monthly schedule after qualified subscription activity." },
    { icon: BarChart3, title: "Referral visibility", body: "Track clicks, leads, demo requests, and expected commission status from your affiliate dashboard." },
    { icon: MessageCircle, title: "Share-ready messaging", body: "Use approved copy for WhatsApp, email, social posts, school groups, and direct introductions." },
    { icon: Target, title: "Clear fit criteria", body: "Know which schools are a good match so you protect trust and avoid low-quality referrals." },
    { icon: Headphones, title: "Support from EduMyles", body: "Our team handles product questions, demos, pricing discussions, and implementation planning." },
  ],
  tiersTitle: "Affiliate tracks for different audiences",
  tiersIntro:
    "Whether you share one warm introduction or run education content at scale, the program gives you a sensible path.",
  tiers: [
    {
      label: "Individual",
      title: "Community Affiliate",
      body: "For teachers, alumni, parents, and education community members.",
      points: ["Tracked referral link", "Simple explainer materials", "WhatsApp-ready messages", "Monthly commission review"],
    },
    {
      label: "Creator",
      title: "Content Affiliate",
      body: "For publishers, bloggers, YouTubers, TikTok creators, and newsletter owners.",
      points: ["Campaign-specific links", "Content briefs", "Launch assets", "Performance reporting"],
    },
    {
      label: "Advisor",
      title: "Consultant Affiliate",
      body: "For school advisors and independent consultants who make warm recommendations.",
      points: ["Intro templates", "Demo coordination", "Lead qualification support", "Partner manager access"],
    },
  ],
  processTitle: "How affiliate referrals move",
  processIntro:
    "The process is intentionally light. You share responsibly, EduMyles qualifies and sells, and commissions are tied to tracked subscription outcomes.",
  steps: [
    { title: "Apply and get approved", body: "Tell us who you reach, how you plan to promote, and where your school audience is based." },
    { title: "Receive your links", body: "We issue tracked links, messaging, and campaign guidance for your audience." },
    { title: "Share and introduce", body: "Promote through content, communities, events, WhatsApp, direct intros, or newsletters." },
    { title: "Earn on subscriptions", body: "When your referral becomes a paying school, commission is calculated and paid monthly." },
  ],
  toolkitTitle: "Affiliate toolkit",
  toolkitIntro:
    "Approved affiliates get practical assets that make EduMyles easier to explain without inventing your own claims.",
  toolkit: ["Tracked links and QR codes", "WhatsApp templates", "Social post copy", "School fit checklist", "Demo request guidance", "Pricing explainer", "Monthly payout report", "Affiliate support contact"],
  faqTitle: "Affiliate Questions",
  faqs: [
    { q: "Do affiliates need to sell the product?", a: "No. Affiliates create qualified introductions and awareness. EduMyles handles demos, technical questions, subscriptions, and onboarding." },
    { q: "How is commission tracked?", a: "Approved affiliates receive tracked links and campaign source tags. Warm introductions can also be logged by the partnerships team." },
    { q: "Can I promote EduMyles on social media?", a: "Yes, as long as claims are accurate and aligned with the approved messaging. We provide copy and product positioning to help." },
    { q: "When do payouts happen?", a: "Payouts are reviewed monthly after a referred school becomes an active paying customer and any qualification checks are complete." },
  ],
  finalTitle: "Turn trusted recommendations into recurring upside.",
  finalBody:
    "If schools already listen when you talk about better systems, EduMyles gives you a clean way to introduce them to a serious platform and get rewarded.",
};

export const resellerProgram: PartnerProgramConfig = {
  eyebrow: "Reseller Program",
  title: "Sell EduMyles with",
  accent: "local strength",
  intro:
    "The reseller program is for ICT firms, school suppliers, implementation consultants, and education technology companies that want to sell, implement, and support EduMyles in their market. Build recurring revenue while helping schools modernize core operations.",
  primaryCta: "Apply as reseller",
  primaryHref: "/apply/reseller",
  secondaryCta: "Compare plans",
  secondaryHref: "/pricing",
  heroIcon: BriefcaseBusiness,
  proof: [
    { value: "35%", label: "upper commission tier" },
    { value: "WL", label: "white-label options" },
    { value: "48h", label: "application review target" },
    { value: "EA", label: "regional expansion focus" },
  ],
  dashboardTitle: "Reseller Revenue Console",
  dashboardKpis: [
    { label: "Pipeline", value: "Active" },
    { label: "Margin", value: "Up to 35%" },
    { label: "Payout", value: "Monthly" },
  ],
  dashboardRows: ["County school group prospect", "Professional plan renewal", "Implementation fee scope", "White-label demo request"],
  fitTitle: "For partners who can sell and support schools locally",
  fitIntro:
    "Resellers are closer to the customer. You bring relationships, local market knowledge, implementation capacity, or bundled services. EduMyles brings the platform, product depth, and partner enablement.",
  fits: [
    { icon: Building2, title: "ICT and EdTech firms", body: "Add EduMyles to your school software, hardware, connectivity, cyber, or managed IT offering." },
    { icon: School, title: "School suppliers", body: "Use existing relationships with administrators and proprietors to introduce a higher-value recurring product." },
    { icon: Wrench, title: "Implementation consultants", body: "Package onboarding, training, data migration, and process improvement around EduMyles rollouts." },
  ],
  benefitsTitle: "A partner model designed for serious commercial execution",
  benefitsIntro:
    "Resellers need more than a referral link. You get sales material, enablement, deal support, and a path to recurring income.",
  benefits: [
    { icon: Coins, title: "Recurring commission", body: "Earn commission on school subscriptions, with higher tiers for stronger reseller performance and larger accounts." },
    { icon: BadgeCheck, title: "Certification path", body: "Train your team on product positioning, implementation basics, and support expectations." },
    { icon: Network, title: "Co-sell support", body: "Bring EduMyles into strategic demos and complex opportunities where product depth matters." },
    { icon: Layers3, title: "White-label options", body: "Qualified resellers can discuss branded deployments, custom domains, and bundled service models." },
    { icon: ClipboardCheck, title: "Proposal assets", body: "Use sales decks, pricing guidance, implementation scope templates, and objection handling notes." },
    { icon: Route, title: "Territory planning", body: "Coordinate target counties, segments, and school networks to avoid chaotic partner overlap." },
  ],
  tiersTitle: "Reseller tiers that grow with your capacity",
  tiersIntro:
    "Start with introductions or move into full commercial ownership. The program can support individuals, small ICT firms, and established regional partners.",
  tiers: [
    {
      label: "Starter",
      title: "Referral Reseller",
      body: "For partners validating EduMyles with a small number of school relationships.",
      points: ["Tracked lead registration", "Sales collateral", "Basic partner onboarding", "Commission on converted schools"],
    },
    {
      label: "Core",
      title: "Authorized Reseller",
      body: "For companies actively selling EduMyles and managing local pipeline.",
      points: ["Dedicated partner manager", "Co-branded sales deck", "Implementation fee opportunity", "Higher recurring commission"],
    },
    {
      label: "Advanced",
      title: "Strategic Reseller",
      body: "For established partners handling large networks, regions, or bundled deployments.",
      points: ["White-label discussion", "Territory planning", "Joint campaigns", "Custom commercial structure"],
    },
  ],
  processTitle: "How reseller onboarding works",
  processIntro:
    "The reseller path is qualification-driven so schools get reliable local support and partners get realistic commercial expectations.",
  steps: [
    { title: "Apply with your market", body: "Share your company profile, target geography, school relationships, and expected volume." },
    { title: "Partner review", body: "We assess fit, capacity, positioning, and any territory or white-label requirements." },
    { title: "Enablement and kit", body: "Approved resellers receive sales assets, demo guidance, pricing notes, and training." },
    { title: "Pipeline and close", body: "Register opportunities, run demos, coordinate co-sell support, and earn commission on closed accounts." },
  ],
  toolkitTitle: "Reseller starter kit",
  toolkitIntro:
    "The reseller kit gives your team enough structure to sell confidently and enough flexibility to package EduMyles with your own services.",
  toolkit: ["Partner sales deck", "Pricing and proposal templates", "Demo account guidance", "Lead registration process", "Implementation scope template", "Co-sell playbook", "Commission reporting", "Brand and white-label notes"],
  faqTitle: "Reseller Questions",
  faqs: [
    { q: "Can resellers charge implementation fees?", a: "Yes. Qualified resellers can package implementation, migration, training, and support services around EduMyles, subject to clear customer scope." },
    { q: "Is white-label available?", a: "White-label is available for qualified reseller partners after review. It depends on volume, support capability, and commercial structure." },
    { q: "Do resellers get exclusive territories?", a: "Territory protection can be discussed for strong partners with clear market coverage, but it is not automatic for every applicant." },
    { q: "Can I be both affiliate and reseller?", a: "Yes. The application review can place you in the right tier, and partners can move from referral into reseller status as capacity grows." },
  ],
  finalTitle: "Build a school software revenue line with EduMyles.",
  finalBody:
    "If your company already serves schools, EduMyles can become the recurring platform at the center of your education technology offering.",
};
