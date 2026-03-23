import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Tag, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

const posts = [
  {
    slug: "cbc-grading-guide-2026",
    title: "The Complete Guide to CBC Grading in Kenya (2026)",
    category: "Education Policy",
    readTime: "8 min read",
    date: "February 14, 2026",
    excerpt: "Everything school administrators and teachers need to know about Competency-Based Curriculum grading — from rubric design to auto-generated report cards.",
    content: [
      {
        type: "intro",
        text: "Kenya's Competency-Based Curriculum (CBC) replaced the 8-4-4 system to shift the focus from rote memorization to skills and competencies. For school administrators and teachers, this means a fundamentally different approach to grading, reporting, and how student progress is documented.",
      },
      {
        type: "h2",
        text: "What is CBC and Why Did It Replace 8-4-4?",
      },
      {
        type: "p",
        text: "The 8-4-4 system, introduced in 1985, was heavily examination-focused. It assessed students through high-stakes terminal exams (KCPE, KCSE) that determined their future. Critics argued it produced students who could memorize facts but struggled to apply knowledge in practical settings. The CBC, launched in 2017 and now rolling into junior secondary, assesses learners continuously on core competencies: Communication & Collaboration, Critical Thinking & Problem Solving, Creativity & Imagination, Digital Literacy, Self-Efficacy, Learning to Learn, and Citizenship.",
      },
      {
        type: "h2",
        text: "The 4 Performance Levels",
      },
      {
        type: "list",
        items: [
          "Exceeds Expectations (EE) — The learner consistently demonstrates mastery beyond the expected level.",
          "Meets Expectations (ME) — The learner demonstrates the expected competency level.",
          "Approaches Expectations (AE) — The learner is progressing but has not yet reached the expected level.",
          "Below Expectations (BE) — The learner needs significant additional support to reach the expected level.",
        ],
      },
      {
        type: "highlight",
        text: "Important: CBC does NOT use percentage marks. Each competency is scored using these four rubric levels. Report cards show EE, ME, AE, or BE for each learning area and sub-strand.",
      },
      {
        type: "h2",
        text: "Core Competencies vs Pertinent & Contemporary Issues (PCIs)",
      },
      {
        type: "p",
        text: "Core Competencies are the broad skills CBC aims to develop. These are not graded separately but are developed through the subject areas. Pertinent & Contemporary Issues (PCIs) — including life skills, financial literacy, environmental education, and social cohesion — are woven into lesson delivery and noted in the learner's portfolio.",
      },
      {
        type: "h2",
        text: "How EduMyles Handles CBC Grading",
      },
      {
        type: "p",
        text: "The EduMyles CBC gradebook allows teachers to score each learner against individual sub-strands using the four-level rubric. At the end of term, the system auto-aggregates scores to generate performance ratings per learning area. Report cards are auto-generated in the KNEC-approved format — ready to print or share digitally with parents.",
      },
      {
        type: "h2",
        text: "Common Mistakes Schools Make with CBC Reporting",
      },
      {
        type: "list",
        items: [
          "Converting CBC rubric levels back to percentages (incorrect — CBC is not percentage-based)",
          "Grading only summative tasks and ignoring formative assessment",
          "Not recording portfolio evidence for competency development",
          "Using 8-4-4 report card templates for CBC learners",
          "Failing to score each sub-strand individually",
        ],
      },
      {
        type: "h2",
        text: "Frequently Asked Questions",
      },
      {
        type: "faq",
        items: [
          { q: "Can CBC and 8-4-4 students be in the same gradebook?", a: "Yes — EduMyles supports dual curriculum. CBC learners (PP1–Grade 9) and 8-4-4 learners (Form 1–4) are tracked separately within the same school account." },
          { q: "How do I generate KNEC-compliant report forms?", a: "From the gradebook, click 'Generate Reports' → select 'CBC Term Report' → choose the class and term. Reports generate instantly in the approved KNEC format." },
          { q: "What happens if a teacher marks a learner BE?", a: "The system flags the learner for intervention and prompts the teacher to record a support plan. School leadership can view all BE-flagged learners in one dashboard." },
          { q: "Is the EduMyles CBC gradebook approved for NEMIS?", a: "Yes — EduMyles exports CBC data in the NEMIS-compatible format required for Ministry of Education reporting." },
          { q: "Can parents see CBC scores in real time?", a: "Yes — parents with the EduMyles parent portal see their child's current CBC performance and can track progress across all sub-strands." },
        ],
      },
    ],
  },
  {
    slug: "mpesa-fee-collection-guide",
    title: "How to Set Up M-Pesa Fee Collection for Your School",
    category: "Finance & Fees",
    readTime: "6 min read",
    date: "January 28, 2026",
    excerpt: "A practical walkthrough for school administrators on integrating M-Pesa — reducing manual reconciliation work and late payments.",
    content: [
      {
        type: "intro",
        text: "M-Pesa is how Kenya pays. Over 96% of Kenyan adults use M-Pesa, and school fees are no exception. Yet many schools still rely on manual reconciliation — finance officers sifting through M-Pesa statements and Excel files every Monday morning. Here's how to do it right.",
      },
      {
        type: "h2",
        text: "Paybill vs Buy Goods: Which Should Your School Use?",
      },
      {
        type: "p",
        text: "For schools, a Safaricom Paybill number is strongly recommended over Buy Goods. With Paybill, parents enter your school's Paybill number plus their child's admission number as the account number. This means every payment is automatically tagged to a specific student — making reconciliation automatic. Buy Goods numbers don't have an account field, making it impossible to auto-match payments to students.",
      },
      {
        type: "h2",
        text: "Connecting M-Pesa to EduMyles (Step by Step)",
      },
      {
        type: "list",
        items: [
          "Step 1: Register or use your existing Safaricom Paybill number for your school.",
          "Step 2: Contact Safaricom to enable Daraja API access (C2B API) for your Paybill.",
          "Step 3: In EduMyles → Settings → Fee Management → M-Pesa Setup, enter your Paybill number, Daraja Consumer Key, and Consumer Secret.",
          "Step 4: Save settings. EduMyles automatically validates the connection.",
          "Step 5: Run a KES 1 test payment to confirm real-time matching is working.",
        ],
      },
      {
        type: "highlight",
        text: "Once connected, every M-Pesa payment to your school Paybill is instantly matched to the student's fee account — no manual entry required. Parents receive an automatic receipt SMS from EduMyles.",
      },
      {
        type: "h2",
        text: "Handling Partial Payments and Fee Plans",
      },
      {
        type: "p",
        text: "EduMyles supports partial fee payments natively. When a parent pays KES 5,000 against a KES 15,000 term balance, the system records the partial payment, updates the balance in real-time, and sends the parent a receipt showing the outstanding amount. You can configure payment plans — for example, allowing up to 3 instalments per term — and the system tracks compliance automatically.",
      },
      {
        type: "h2",
        text: "Reducing Late Payments with Automated Reminders",
      },
      {
        type: "list",
        items: [
          "Configure automatic SMS reminders at 30 days, 14 days, and 7 days before fee deadlines.",
          "Set up automated WhatsApp messages for parents who haven't paid after the reminder cycle.",
          "Use the Fee Defaulters report to identify and personally call parents of students with persistent arrears.",
          "Offer early-payment incentives by configuring a small discount for full payment before a set date.",
        ],
      },
      {
        type: "h2",
        text: "Frequently Asked Questions",
      },
      {
        type: "faq",
        items: [
          { q: "What if a parent uses the wrong admission number?", a: "EduMyles flags unmatched M-Pesa payments in a 'Unallocated Payments' queue. The finance officer can manually allocate them to the correct student with one click." },
          { q: "Can we collect fees for multiple campuses via one Paybill?", a: "Yes — EduMyles multi-campus plans support multiple Paybill numbers or a single shared Paybill with campus codes as the account prefix." },
          { q: "Does EduMyles support bank transfer payments too?", a: "Yes — manual bank transfer payments can be recorded by the finance officer. M-Pesa reconciliation is automatic; bank transfers are entered manually." },
          { q: "Is there a transaction fee?", a: "EduMyles does not charge per transaction. Standard Safaricom M-Pesa transaction fees apply on the payer's side." },
        ],
      },
    ],
  },
  {
    slug: "how-kenyan-schools-manage-payroll",
    title: "How Kenyan Schools Should Manage Teacher Payroll in 2026",
    category: "HR & Payroll",
    readTime: "7 min read",
    date: "January 10, 2026",
    excerpt: "A guide to statutory deductions, TSC compliance, NHIF/SHA, NSSF, and PAYE for school HR managers — with a practical end-of-month checklist.",
    content: [
      {
        type: "intro",
        text: "Teacher payroll is one of the most complex — and highest-stakes — administrative tasks for Kenyan schools. Get it wrong and you face penalty interest from KRA, disputes with staff, and potential compliance issues with the TSC. Here's what you need to know in 2026.",
      },
      {
        type: "h2",
        text: "TSC vs BOM Payroll: Know the Difference",
      },
      {
        type: "p",
        text: "TSC (Teachers Service Commission) teachers are paid directly by the government through the TSC payroll. Schools do not process their salaries — but may need to manage their leave records and ensure TSC code compliance. BOM (Board of Management) teachers are hired and paid directly by the school. This is the payroll that school HR managers are responsible for, and where EduMyles payroll management applies.",
      },
      {
        type: "h2",
        text: "Statutory Deductions in 2026",
      },
      {
        type: "list",
        items: [
          "PAYE (Pay As You Earn): Progressive income tax rates — 10% on first KES 24,000, 25% on KES 24,001–32,333, 30% on KES 32,334–500,000, 32.5% on KES 500,001–800,000, 35% above KES 800,000.",
          "SHA (Social Health Authority): Replaced NHIF from October 2024. Contribution is 2.75% of gross salary, no upper cap.",
          "NSSF (New Rates from 2023): Tier I — 6% of employee's earnings up to KES 18,000 (employer matches). Tier II — 6% on earnings between KES 18,001–KES 36,000 (employer matches). Review current court decisions on NSSF implementation.",
          "Housing Levy: 1.5% of gross salary, employer also contributes 1.5%.",
        ],
      },
      {
        type: "highlight",
        text: "EduMyles payroll auto-calculates PAYE, SHA, NSSF, and Housing Levy based on current rates. Rates are updated by our compliance team whenever legislation changes.",
      },
      {
        type: "h2",
        text: "Managing Allowances",
      },
      {
        type: "p",
        text: "Common teacher allowances include: House Allowance (taxable if above KES 15,000/month threshold for most staff), Commuter Allowance (non-taxable up to KES 5,000/month), Hardship Allowance (varies by station), and Leave Travelling Allowance (LTA). EduMyles payroll supports configuring multiple allowance types with their correct tax treatment.",
      },
      {
        type: "h2",
        text: "End-of-Month Payroll Checklist",
      },
      {
        type: "list",
        items: [
          "✓ Verify all new hires and terminations are updated in the system",
          "✓ Approve all leave records for the month",
          "✓ Check for any salary adjustments, promotions, or step increases",
          "✓ Run payroll preview and review for anomalies",
          "✓ Generate and review PAYE schedule before submission to KRA",
          "✓ Process bank transfers to staff accounts",
          "✓ File SHA returns by the 9th of the following month",
          "✓ File NSSF returns by the 15th of the following month",
          "✓ File PAYE returns to KRA by the 9th of the following month",
          "✓ Archive payslips to staff member portals",
        ],
      },
      {
        type: "faq",
        items: [
          { q: "Does EduMyles generate KRA-compliant payroll reports?", a: "Yes — EduMyles generates P9 forms, PAYE schedules, and SHA/NSSF summary sheets in formats accepted for KRA filing." },
          { q: "Can we run payroll for both TSC and BOM staff in one system?", a: "EduMyles manages BOM staff payroll. TSC staff can be added for leave tracking and HR records, but their salary is not processed through EduMyles." },
          { q: "How does the system handle mid-month joiners or leavers?", a: "EduMyles pro-rates salary automatically based on the number of working days when a staff member joins or leaves mid-month." },
        ],
      },
    ],
  },
];

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} — EduMyles Blog`,
    description: post.excerpt,
  };
}

function renderContent(block: (typeof posts)[0]["content"][0]) {
  if (block.type === "intro") {
    return (
      <p key={block.text} className="font-jakarta text-[16px] leading-[1.9] font-light" style={{ color: "#374151" }}>
        {block.text}
      </p>
    );
  }
  if (block.type === "h2") {
    return (
      <h2 key={block.text} className="font-playfair font-bold text-[22px] mt-10 mb-4" style={{ color: "#061A12" }}>
        {block.text}
      </h2>
    );
  }
  if (block.type === "p") {
    return (
      <p key={block.text} className="font-jakarta text-[15px] leading-[1.9]" style={{ color: "#5a5a5a" }}>
        {block.text}
      </p>
    );
  }
  if (block.type === "highlight" && block.text) {
    return (
      <div key={block.text} className="rounded-xl p-5 my-2" style={{ background: "rgba(232,160,32,0.06)", border: "1px solid rgba(232,160,32,0.2)" }}>
        <p className="font-jakarta font-semibold text-[14px] leading-[1.8]" style={{ color: "#374151" }}>{block.text}</p>
      </div>
    );
  }
  if (block.type === "list" && block.items) {
    const listItems = block.items as string[];
    return (
      <ul key="list-block" className="flex flex-col gap-2.5 my-2">
        {listItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 font-jakarta text-[14.5px] leading-[1.8]" style={{ color: "#5a5a5a", listStyle: "none" }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A7A4A", display: "block" }} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "faq" && block.items) {
    const faqItems = block.items as { q: string; a: string }[];
    return (
      <div key="faq-block" className="flex flex-col gap-4 my-2">
        {faqItems.map((item, idx) => (
          <div key={idx} className="rounded-xl p-5" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
            <p className="font-jakarta font-bold text-[14px] mb-2" style={{ color: "#061A12" }}>{item.q}</p>
            <p className="font-jakarta text-[13.5px] leading-[1.8]" style={{ color: "#5a5a5a" }}>{item.a}</p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const related = posts.filter((p) => p.slug !== post.slug);

  return (
    <div style={{ color: "#212121" }}>
      {/* Hero */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{ background: "#061A12", borderTop: "3px solid #E8A020", padding: "5rem 2rem 4rem" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
          backgroundSize: "50px 50px",
        }} />
        <div className="relative max-w-[860px] mx-auto w-full">
          <Link href="/blog" className="inline-flex items-center gap-2 font-jakarta text-[13px] mb-6 no-underline transition-colors duration-200" style={{ color: "#6B9E83" }}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Back to Blog
          </Link>
          <div className="flex flex-wrap gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-[12px] px-4 py-1.5 rounded-full" style={{ background: "rgba(232,160,32,0.12)", border: "1px solid rgba(232,160,32,0.3)", color: "#E8A020" }}>
              <Tag className="w-3 h-3" strokeWidth={2} />
              {post.category}
            </span>
          </div>
          <h1 className="font-playfair font-bold leading-tight mb-5" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "#ffffff" }}>
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-5">
            <span className="inline-flex items-center gap-2 font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
              {post.date}
            </span>
            <span className="inline-flex items-center gap-2 font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
              {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Article */}
      <div className="max-w-[860px] mx-auto px-6 py-16">
        <div className="flex flex-col gap-5">
          {post.content.map((block, i) => (
            <div key={i}>{renderContent(block)}</div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-14" style={{ borderTop: "1px solid #e8f4ec" }} />

        {/* Related posts */}
        <div>
          <h3 className="font-playfair font-bold text-[20px] mb-6" style={{ color: "#061A12" }}>Related Articles</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="rounded-xl p-5 no-underline transition-all duration-200 hover:-translate-y-0.5 group" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
                <span className="font-jakarta text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#6B9E83" }}>{r.category}</span>
                <h4 className="font-playfair font-bold text-[15px] mb-2 group-hover:text-[#E8A020] transition-colors duration-200" style={{ color: "#061A12" }}>{r.title}</h4>
                <span className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-[12px]" style={{ color: "#1A7A4A" }}>
                  Read article <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl p-8 text-center" style={{ background: "#061A12" }}>
          <h3 className="font-playfair font-bold text-[22px] text-white mb-3">Ready to manage your school smarter?</h3>
          <p className="font-jakarta text-[14px] mb-6" style={{ color: "#A8E6C3" }}>Join 50+ schools already running better with EduMyles. Free 30-day trial.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup/api" className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-7 py-3.5 rounded-[50px] no-underline" style={{ background: "#E8A020", color: "#061A12" }}>
              Start Free Trial →
            </Link>
            <Link href="/contact?subject=demo" className="inline-flex items-center gap-2 font-jakarta font-semibold text-[14px] px-7 py-3.5 rounded-[50px] no-underline" style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.3)", color: "#ffffff" }}>
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
