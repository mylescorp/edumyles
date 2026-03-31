import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Users, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

const studies = [
  {
    slug: "nairobi-green-academy",
    tag: "Primary School · CBC",
    school: "Nairobi Green Academy",
    location: "Westlands, Nairobi, Kenya",
    students: "800 students",
    title: "How Nairobi Green Academy Increased Fee Collection by 40% in One Term",
    metrics: [
      { value: "40%", label: "Fee collection increase" },
      { value: "800", label: "Students digitised" },
      { value: "3 weeks", label: "To go live" },
      { value: "KES 8.2M", label: "Fees processed T1" },
    ],
    challenge: "The school was managing fee records for 800 students across 8 classes using Excel spreadsheets and manual M-Pesa transaction logs. The finance officer spent every Monday morning reconciling weekend payments — a 4–5 hour process with frequent errors. Fee defaulters weren't tracked consistently, and parents often disputed balances because receipts weren't issued in real time.",
    solution: "EduMyles was deployed at the start of Term 1 2025. The finance team completed training in one afternoon. The school's existing Safaricom Paybill number was connected to EduMyles via the Daraja API — from that point, all incoming M-Pesa payments auto-reconciled instantly against student accounts.",
    timeline: [
      { day: "Day 1", event: "Admin team training (4 hours). All staff and class accounts created." },
      { day: "Day 3", event: "M-Pesa Daraja integration live and tested. First payments auto-reconciled." },
      { day: "Day 7", event: "Parent portal invites sent to all 800 student families via SMS." },
      { day: "Day 14", event: "85% parent portal adoption. Fee reminder automation activated." },
      { day: "Day 21", event: "Fully live. First fee balance report generated showing 40% improvement vs prior term." },
    ],
    quote: "I used to dread Monday mornings. Now I arrive to find every M-Pesa payment already matched and receipted. I can finally focus on the students instead of spreadsheets.",
    quotePerson: "Grace Njeri, Finance Officer — Nairobi Green Academy",
  },
  {
    slug: "st-francis-kisumu",
    tag: "Secondary School · KCSE + CBC",
    school: "St. Francis High School",
    location: "Kisumu, Kenya",
    students: "1,200 students",
    title: "St. Francis Cut Report Card Generation from 3 Days to 3 Hours",
    metrics: [
      { value: "96%", label: "Time saved on reports" },
      { value: "1,200", label: "Students" },
      { value: "47", label: "Teachers onboarded" },
      { value: "4.8/5", label: "Teacher satisfaction" },
    ],
    challenge: "End-of-term reporting at St. Francis meant three teachers working an entire weekend to manually compile and print 1,200 report cards. Errors were common — wrong student names, incorrect subject scores, missing teacher signatures. Parents complained. The Deputy Principal described the process as 'the most stressful three days of the year, every term.'",
    solution: "EduMyles gradebook was rolled out at the start of the academic year. Teachers entered grades throughout the term — in class, on their phones, or at home. At term end, the Deputy Principal clicked 'Generate Reports' and all 1,200 report cards were ready in under 3 hours, with zero errors.",
    timeline: [
      { day: "Week 1", event: "All 47 teachers trained on the EduMyles mobile gradebook in two sessions." },
      { day: "Week 2", event: "Class registration complete. All 1,200 students enrolled with subject mappings." },
      { day: "Mid-Term", event: "First mid-term grades entered. Teachers reported 30 min/week vs 3 hrs previously." },
      { day: "Term End", event: "All reports generated in 3 hours. Zero errors. First fully digital end-of-term." },
    ],
    quote: "The first term we used EduMyles, I couldn't believe it. Friday afternoon, I clicked generate, and all 1,200 reports were done by 5pm. No more weekend work.",
    quotePerson: "Mr. James Oduya, Deputy Principal Academics — St. Francis High School, Kisumu",
  },
  {
    slug: "brookside-prep",
    tag: "International Prep · IGCSE",
    school: "Brookside International Preparatory",
    location: "Karen, Nairobi, Kenya",
    students: "450 students",
    title: "Brookside Prep Went Fully Digital in 11 Days",
    metrics: [
      { value: "11 days", label: "To go live" },
      { value: "98%", label: "Parent portal adoption" },
      { value: "450", label: "Students" },
      { value: "32", label: "Teachers" },
    ],
    challenge: "Brookside Prep ran on paper registers, WhatsApp parent groups, and email-based grade updates. There was no central system. The Head of School wanted to enter the new academic year fully digital — and the start of term was 11 days away.",
    solution: "EduMyles rapid deployment: Day 1 admin training, Day 3 teacher onboarding, Day 7 parent portal invitations, Day 11 first fully digital school day. The implementation team worked alongside the school's leadership every step of the way.",
    timeline: [
      { day: "Day 1", event: "Admin and leadership training. School structure, classes, and subjects configured." },
      { day: "Day 3", event: "All 32 teachers trained. Attendance marking live from Day 4." },
      { day: "Day 7", event: "Parent portal invites sent via SMS to all 450 families." },
      { day: "Day 9", event: "73% of parents had activated their portal. Real-time attendance SMS live." },
      { day: "Day 11", event: "First fully digital school day. 98% parent portal adoption by end of week 2." },
    ],
    quote: "We told our parents we were going digital and they were nervous. Within a week, 98% of them were using the app. It sells itself.",
    quotePerson: "Catherine Njoroge, Head of Administration — Brookside International Prep",
  },
];

export function generateStaticParams() {
  return studies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = studies.find((s) => s.slug === slug);
  if (!study) return { title: "Case Study Not Found" };
  return {
    title: `${study.school} Case Study — EduMyles`,
    description: study.title,
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = studies.find((s) => s.slug === slug);
  if (!study) notFound();

  const related = studies.filter((s) => s.slug !== study.slug);

  return (
    <div style={{ color: "#212121" }}>
      {/* Hero */}
      <section className="relative flex items-center overflow-hidden" style={{ background: "#061A12", borderTop: "3px solid #E8A020", padding: "5rem 2rem 4rem" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
          backgroundSize: "50px 50px",
        }} />
        <div className="relative max-w-[1000px] mx-auto w-full">
          <Link href="/case-studies" className="inline-flex items-center gap-2 font-jakarta text-[13px] mb-6 no-underline" style={{ color: "#6B9E83" }}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            All Case Studies
          </Link>
          <div className="inline-block font-jakarta font-semibold text-[12px] mb-4 px-4 py-1.5 rounded-full" style={{ background: "rgba(232,160,32,0.12)", border: "1px solid rgba(232,160,32,0.3)", color: "#E8A020" }}>
            {study.tag}
          </div>
          <h1 className="font-playfair font-bold leading-tight mb-5" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", color: "#ffffff" }}>
            {study.title}
          </h1>
          <div className="flex flex-wrap gap-5">
            <span className="inline-flex items-center gap-2 font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              {study.location}
            </span>
            <span className="inline-flex items-center gap-2 font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
              {study.students}
            </span>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      <div style={{ background: "#F3FBF6", borderBottom: "1px solid #d4eade" }}>
        <div className="max-w-[1000px] mx-auto px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {study.metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div className="font-playfair font-bold mb-1" style={{ fontSize: "2rem", color: "#E8A020" }}>{m.value}</div>
                <div className="font-jakarta text-[13px]" style={{ color: "#5a5a5a" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1000px] mx-auto px-6 py-16 flex flex-col gap-12">

        {/* Challenge */}
        <section>
          <h2 className="font-playfair font-bold text-[22px] mb-4" style={{ color: "#061A12" }}>The Challenge</h2>
          <p className="font-jakarta text-[15px] leading-[1.9]" style={{ color: "#5a5a5a" }}>{study.challenge}</p>
        </section>

        {/* Solution */}
        <section>
          <h2 className="font-playfair font-bold text-[22px] mb-4" style={{ color: "#061A12" }}>The Solution</h2>
          <p className="font-jakarta text-[15px] leading-[1.9]" style={{ color: "#5a5a5a" }}>{study.solution}</p>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="font-playfair font-bold text-[22px] mb-6" style={{ color: "#061A12" }}>Implementation Timeline</h2>
          <div className="flex flex-col gap-3">
            {study.timeline.map((t, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl p-5" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
                <span className="font-jakarta font-bold text-[12px] px-3 py-1 rounded-full flex-shrink-0" style={{ background: "#E8A020", color: "#061A12" }}>{t.day}</span>
                <p className="font-jakarta text-[14px] leading-[1.7]" style={{ color: "#374151" }}>{t.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <blockquote className="rounded-2xl p-8" style={{ background: "#061A12", borderLeft: "4px solid #E8A020" }}>
          <p className="font-playfair italic text-[18px] leading-[1.7] text-white mb-4">&ldquo;{study.quote}&rdquo;</p>
          <cite className="font-jakarta font-semibold text-[13px] not-italic" style={{ color: "#E8A020" }}>{study.quotePerson}</cite>
        </blockquote>

        {/* Related */}
        <section>
          <h3 className="font-playfair font-bold text-[20px] mb-5" style={{ color: "#061A12" }}>More Case Studies</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {related.map((r) => (
              <Link key={r.slug} href={`/case-studies/${r.slug}`} className="rounded-xl p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 group" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
                <span className="font-jakarta text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#6B9E83" }}>{r.tag}</span>
                <h4 className="font-playfair font-bold text-[15px] mb-2 group-hover:text-[#E8A020] transition-colors duration-200" style={{ color: "#061A12" }}>{r.title}</h4>
                <span className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-[12px]" style={{ color: "#1A7A4A" }}>
                  Read case study <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "#061A12" }}>
          <h3 className="font-playfair font-bold text-[22px] text-white mb-3">Want results like these?</h3>
          <p className="font-jakarta text-[14px] mb-6" style={{ color: "#A8E6C3" }}>Start your 30-day free trial. No credit card required.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup/api" className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-7 py-3.5 rounded-[50px] no-underline" style={{ background: "#E8A020", color: "#061A12" }}>
              Start Free Trial →
            </Link>
            <Link href="/book-demo" className="inline-flex items-center gap-2 font-jakarta font-semibold text-[14px] px-7 py-3.5 rounded-[50px] no-underline" style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.3)", color: "#ffffff" }}>
              Book a Demo
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
