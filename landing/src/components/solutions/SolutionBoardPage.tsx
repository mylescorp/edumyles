import Link from "next/link";
import { ArrowRight, BookOpen, FileSpreadsheet, ShieldCheck } from "lucide-react";
import BoardSpotlight from "@/components/sections/BoardSpotlight";

type Module = { code: string; name: string; description: string };
type SolutionBoardConfig = {
  kind: "primary" | "secondary" | "international" | "groups";
  label: string;
  title: string;
  intro: string;
  eyebrow: string;
  focusTitle: string;
  focusIntro: string;
  focusPoints: string[];
  challenges: { title: string; description: string }[];
  modules: Module[];
  faqs: { question: string; answer: string }[];
};

const sharedModules: Record<string, Module> = {
  FIN: { code: "FIN", name: "Finance & Fees", description: "Fee structures, invoicing, M-Pesa collection, receipts, and full financial reporting. No more Excel chaos." },
  ACA: { code: "ACA", name: "Academics & Gradebook", description: "Assessments, grading, report cards, and curriculum tracking. Supports CBC, 8-4-4, UNEB, and more." },
  SIS: { code: "SIS", name: "Student Information System", description: "Complete student profiles, class allocation, streams, and full academic history in one place." },
  COM: { code: "COM", name: "Communications", description: "SMS, email, and in-app messaging to parents, staff, and students. Bulk announcements in seconds." },
  WAL: { code: "WAL", name: "eWallet", description: "Digital wallet for cashless transactions within the school ecosystem. Parents top up, students spend." },
  TRN: { code: "TRN", name: "Transport", description: "Route planning, vehicle tracking, driver assignment, and real-time parent notifications for safe journeys." },
  TTB: { code: "TTB", name: "Timetable & Scheduling", description: "Automated timetable generation, substitution management, room bookings, and conflict detection." },
  HR: { code: "HR", name: "HR & Payroll", description: "Staff records, attendance, leave management, payroll processing, and statutory compliance (KRA, NHIF, NSSF)." },
  LIB: { code: "LIB", name: "Library", description: "Book cataloguing, borrowing, returns, fines, overdue notices, and digital resource management." },
  USR: { code: "USR", name: "User Management", description: "Invite users, assign roles, and control access across every portal and campus from one dashboard." },
  ADM: { code: "ADM", name: "Admissions", description: "Digital applications, enrollment workflows, waitlists, and automated communication, paperless from day one." },
  TKT: { code: "TKT", name: "Support Tickets", description: "Track school support requests from staff, parents, and students with clear ownership and history." },
};

export const solutionBoardConfigs: Record<SolutionBoardConfig["kind"], SolutionBoardConfig> = {
  primary: {
    kind: "primary", label: "Primary schools", title: "Built for primary schools.",
    intro: "CBC-ready with M-Pesa integration and automated fee management, so your team spends less time on paperwork and more on pupils.",
    eyebrow: "Academics", focusTitle: "CBC assessment that teachers enjoy.", focusIntro: "Record competencies once and generate report cards for every pupil in one click.", focusPoints: ["Learning areas and strands", "Auto report cards", "Parent report portal"],
    challenges: [
      { title: "Termly fee collection", description: "Parents pay from their phones with M-Pesa. Receipts and balances update on their own." },
      { title: "CBC assessment reporting", description: "Competency-based assessment, learning areas and strand reports in one gradebook." },
      { title: "Parent communication", description: "SMS and app updates reach every guardian without a single WhatsApp group." },
    ], modules: ["FIN", "ACA", "SIS", "COM", "WAL", "TRN"].map((key) => sharedModules[key]!),
    faqs: [
      { question: "Does EduMyles support the CBC curriculum?", answer: "Yes. The gradebook supports competency-based assessment, learning areas and strand reports, alongside 8-4-4." },
      { question: "Can parents pay with M-Pesa?", answer: "Yes. M-Pesa payments are matched to the right pupil automatically and receipts are sent right away." },
      { question: "How long does setup take?", answer: "Most primary schools set up classes, import records and go live in a few days with our onboarding team." },
    ],
  },
  secondary: {
    kind: "secondary", label: "Secondary schools", title: "Built for secondary schools.",
    intro: "KCSE management, advanced timetabling and HR payroll systems for schools with larger teams and more moving parts.",
    eyebrow: "Operations", focusTitle: "Every stream, teacher and room in one view.", focusIntro: "Principals see attendance, results, fees and staffing in a single dashboard.", focusPoints: ["Auto-generated timetables", "Teacher substitutions", "Payroll and statutory deductions"],
    challenges: [
      { title: "Complex timetables", description: "Generate conflict-free timetables across streams, teachers, labs and rooms in seconds." },
      { title: "KCSE and subject combinations", description: "Manage subject selections, assessments and exam results through to KCSE." },
      { title: "Payroll and compliance", description: "Run payroll with KRA, NHIF and NSSF deductions and issue payslips automatically." },
    ], modules: ["TTB", "ACA", "HR", "FIN", "LIB", "SIS"].map((key) => sharedModules[key]!),
    faqs: [
      { question: "Can EduMyles handle KCSE results?", answer: "Yes. Results are captured per subject and stream and roll up into report cards and analytics." },
      { question: "Does it include payroll?", answer: "Yes. The HR and Payroll module handles contracts, leave, payroll and KRA, NHIF and NSSF compliance." },
      { question: "Can we run boarding and transport?", answer: "Transport routes and parent notifications are built in. Boarding workflows can be scoped with our team." },
    ],
  },
  international: {
    kind: "international", label: "International schools", title: "Built for international schools.",
    intro: "IGCSE support with SSO and white-label options, so families see your school, not ours.",
    eyebrow: "Academics", focusTitle: "IGCSE gradebooks with predicted grades.", focusIntro: "Track internal assessments, predicted grades and issue branded transcripts.", focusPoints: ["IGCSE grade scales", "Predicted grade tracking", "Branded transcripts"],
    challenges: [
      { title: "IGCSE and mixed curricula", description: "Configure IGCSE subjects and grade scales next to CBC or national programmes." },
      { title: "SSO and enterprise security", description: "Google Workspace and Microsoft 365 sign-in with multi-factor authentication for administrators." },
      { title: "Your brand, your domain", description: "White-label portals with your logo, colours and domain for parents and students." },
    ], modules: ["ACA", "USR", "ADM", "FIN", "COM", "TKT"].map((key) => sharedModules[key]!),
    faqs: [
      { question: "Is IGCSE supported?", answer: "Yes. IGCSE subjects, grade scales, predicted grades and internal assessment tracking are supported." },
      { question: "Can parents pay in other currencies?", answer: "Card payments are supported for international families alongside M-Pesa and bank transfer." },
      { question: "Is white-label available?", answer: "White-label options are available on Enterprise plans. Talk to us about your domain and branding." },
    ],
  },
  groups: {
    kind: "groups", label: "School groups", title: "Built for school groups.",
    intro: "Multi-campus management with consolidated reporting and analytics, with strict data separation between schools.",
    eyebrow: "Group view", focusTitle: "See the whole group at a glance.", focusIntro: "Group leaders switch between campuses or view consolidated numbers in one place.", focusPoints: ["Campus switching", "Consolidated analytics", "Role-based access per campus"],
    challenges: [
      { title: "Consolidated reporting", description: "Compare enrollment, fee collection and results across every campus from one dashboard." },
      { title: "Campus-level control", description: "Each campus keeps its own data, staff and settings with zero data bleed." },
      { title: "One commercial relationship", description: "A single agreement, a dedicated success manager and priority support for the whole group." },
    ], modules: ["USR", "FIN", "SIS", "HR", "ADM", "TKT"].map((key) => sharedModules[key]!),
    faqs: [
      { question: "Can each campus have its own settings?", answer: "Yes. Campuses keep separate data, staff and settings while sharing group-level reporting." },
      { question: "How does pricing work for groups?", answer: "Group pricing is custom. Tell us about your campuses and we will prepare a quote." },
      { question: "Do you offer onsite training?", answer: "On-site setup and training are available on Enterprise plans." },
    ],
  },
};

export default function SolutionBoardPage({ kind }: { kind: SolutionBoardConfig["kind"] }) {
  const page = solutionBoardConfigs[kind];
  return (
    <div className="solution-board-page">
      <section className="page-hero">
        <div className="mx-auto max-w-[760px]">
          <span className="board-eyebrow">{page.label}</span>
          <h1>{page.title}</h1>
          <p className="subtext mx-auto mt-5 max-w-[680px]">{page.intro}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link className="rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)]" href="/waitlist">Start Free Trial <ArrowRight className="ml-1 inline" size={16} /></Link>
            <Link className="rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3 font-semibold text-[var(--ink)]" href="/book-demo">Book a Demo</Link>
          </div>
        </div>
      </section>
      <section className="content-section solution-board-challenges">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-9 text-center"><span className="board-eyebrow">Challenges we solve</span><h2>The work that slows your school down, handled.</h2></div>
          <div className="grid gap-5 md:grid-cols-3">{page.challenges.map((challenge, index) => {
            const Icon = [BookOpen, FileSpreadsheet, ShieldCheck][index]!;
            return <article className="solution-board-card" key={challenge.title}><span className="solution-board-icon"><Icon size={22} /></span><h3>{challenge.title}</h3><p>{challenge.description}</p></article>;
          })}</div>
        </div>
      </section>
      <BoardSpotlight eyebrow={page.eyebrow} title={page.focusTitle} description={page.focusIntro} points={page.focusPoints} href="/book-demo" linkLabel="See how it works" kind={kind === "groups" ? "dashboard" : "gradebook"} />
      <section className="content-section solution-board-modules">
        <div className="mx-auto max-w-[1120px]"><div className="mb-9 text-center"><span className="board-eyebrow">What you get</span><h2>The modules schools like yours use most.</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{page.modules.map((module) => <article className="solution-board-module" key={module.code}><span>{module.code}</span><h3>{module.name}</h3><p>{module.description}</p></article>)}</div>
        </div>
      </section>
      <section className="content-section solution-board-steps">
        <div className="mx-auto max-w-[1120px]"><div className="mb-9 text-center"><span className="board-eyebrow">Getting started</span><h2>Live in three steps.</h2></div>
          <div className="grid gap-5 md:grid-cols-3">{[
            ["Set up your school", "Create your profile, add classes and invite your team."],
            ["Import your data", "Bring students, staff and fee records from Excel with our help."],
            ["Go live", "Train staff, switch on parent access and start collecting fees digitally."],
          ].map(([title, text], index) => <article className="solution-board-step" key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>
      <section className="content-section solution-board-faq">
        <div className="mx-auto max-w-[850px]"><div className="mb-8 text-center"><span className="board-eyebrow">FAQ</span><h2>Questions, answered.</h2></div>
          <div className="grid gap-3">{page.faqs.map(({ question, answer }) => <details className="solution-board-question" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>
      <section className="solution-board-cta"><div><span className="board-eyebrow">{page.label}</span><h2>See EduMyles in your context.</h2><p>Book a walkthrough tailored to your school type and curriculum.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/book-demo" className="rounded-full bg-white px-6 py-3 font-semibold text-[#0f2a24]">Book a Demo</Link><Link href="/pricing" className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white">See Pricing</Link></div></div></section>
    </div>
  );
}
