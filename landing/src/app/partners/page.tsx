import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, HandCoins, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Partner with EduMyles — Build, Refer or Resell",
  description: "Explore developer, affiliate and reseller partnership paths with EduMyles.",
};

const paths = [
  { icon: Code2, title: "Developers", description: "Build useful integrations and school workflows with EduMyles.", href: "/developers" },
  { icon: HandCoins, title: "Affiliates", description: "Introduce schools to EduMyles through the networks that trust you.", href: "/affiliate" },
  { icon: Store, title: "Resellers", description: "Sell and support EduMyles with local school relationships.", href: "/resellers" },
];
const questions = [
  ["Which partner path is right for me?", "Choose the path that matches what you do: developers build integrations, affiliates make trusted introductions, and resellers sell and support schools locally."],
  ["How do I apply?", "Open the partner path that fits your work and use its application link to tell us about your organization and plans."],
  ["Can I work with EduMyles in more than one way?", "Yes. Tell us about the work you do and our partnerships team can discuss a suitable path."],
];

export default function PartnersPage() {
  return (
    <div className="solutions-board-page">
      <section className="page-hero">
        <span className="board-eyebrow">Partner program</span>
        <h1>Grow with EduMyles, your way.</h1>
        <p className="subtext mx-auto mt-5 max-w-[680px]">Choose the partner path that fits the work you do with schools.</p>
      </section>
      <section className="content-section solutions-board-cards">
        <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-2 lg:grid-cols-3">{paths.map(({ icon: Icon, title, description, href }) => <Link key={title} href={href} className="solutions-board-card"><span><Icon size={24} /></span><div><h2>{title}</h2><p>{description}</p><b>Explore this path <ArrowRight size={16} /></b></div></Link>)}</div>
      </section>
      <section className="content-section solution-board-steps">
        <div className="mx-auto max-w-[1120px]"><div className="mb-9 text-center"><span className="board-eyebrow">Getting started</span><h2>From application to launch.</h2></div><div className="grid gap-5 md:grid-cols-3">{[["Choose a path", "Select the partner program that fits your work."], ["Share your plan", "Tell us about your audience, product or school support services."], ["Plan the next steps", "Our team will follow up to discuss fit and a practical launch path."]].map(([title, text], i) => <article className="solution-board-step" key={title}><span>{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div>
      </section>
      <section className="content-section solution-board-faq"><div className="mx-auto max-w-[850px]"><div className="mb-8 text-center"><span className="board-eyebrow">FAQ</span><h2>Questions, answered.</h2></div><div className="grid gap-3">{questions.map(([q, a]) => <details className="solution-board-question" key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>
      <section className="solutions-board-cta"><span className="board-eyebrow">Partner with EduMyles</span><h2>Find the partner path that fits you.</h2><p>Tell us how you work with schools and we will help you find a starting point.</p><Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 font-semibold text-foreground">Talk to our team <ArrowRight size={16} /></Link></section>
    </div>
  );
}
