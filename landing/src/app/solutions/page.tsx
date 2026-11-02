import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Globe2, GraduationCap, School } from "lucide-react";

export const metadata: Metadata = {
  title: "Solutions — EduMyles | School Management for Every Institution",
  description: "Explore EduMyles for primary schools, secondary schools, international schools, and school groups.",
};

const schools = [
  { icon: School, title: "Primary Schools", description: "CBC-ready school management for pupil records, assessment, fees and parent communication.", href: "/solutions/primary" },
  { icon: GraduationCap, title: "Secondary Schools", description: "Coordinate subject combinations, timetables, academics and staff workflows.", href: "/solutions/secondary" },
  { icon: Globe2, title: "International Schools", description: "Support IGCSE and mixed curricula with secure access and branded portals.", href: "/solutions/international" },
  { icon: Building2, title: "School Groups", description: "Manage campuses separately while bringing group reporting together.", href: "/solutions/groups" },
];
const modules = ["Student Information System", "Admissions", "Finance & Fees", "Timetable & Scheduling", "Academics & Gradebook", "HR & Payroll", "Library", "Transport", "Communications", "eWallet", "School Shop", "User Management", "Support Tickets"];

export default function SolutionsPage() {
  return (
    <div className="solutions-board-page">
      <section className="page-hero">
        <span className="board-eyebrow">Solutions</span>
        <h1>One platform, every kind of school.</h1>
        <p className="subtext mx-auto mt-5 max-w-[700px]">Configure EduMyles around the way your school works, from daily operations to the needs of each campus.</p>
      </section>
      <section className="content-section solutions-board-cards">
        <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-2">{schools.map(({ icon: Icon, title, description, href }) => <Link key={title} href={href} className="solutions-board-card"><span><Icon size={24} /></span><div><h2>{title}</h2><p>{description}</p><b>Explore solution <ArrowRight size={16} /></b></div></Link>)}</div>
      </section>
      <section className="content-section solutions-board-modules">
        <div className="mx-auto max-w-[1120px]"><div className="mb-9 text-center"><span className="board-eyebrow">One connected platform</span><h2>The same 13 modules, configured for you.</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{modules.map((module) => <div className="solutions-board-module" key={module}><span aria-hidden="true">✓</span>{module}</div>)}</div></div>
      </section>
      <section className="solutions-board-cta"><span className="board-eyebrow">Your school, your setup</span><h2>Tell us about your school and we will map it.</h2><p>We will walk through your school type, curriculum and operating needs together.</p><Link href="/book-demo" className="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 font-semibold text-foreground">Book a Demo <ArrowRight size={16} /></Link></section>
    </div>
  );
}
