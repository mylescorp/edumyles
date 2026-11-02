import Link from "next/link";

export default function Testimonial() {
  return (
    <section className="content-section handoff-stories" aria-labelledby="school-stories-title">
      <div className="mx-auto max-w-[760px] text-center">
        <span className="board-eyebrow">School stories</span>
        <h2 id="school-stories-title" className="mt-3 text-[clamp(30px,4vw,44px)] font-bold leading-tight text-[var(--ink)]">
          What schools say.
        </h2>
        <div className="mt-7 rounded-[28px] bg-[var(--deep)] px-8 py-10 text-white sm:px-12">
          <p className="mx-auto max-w-[560px] text-lg leading-relaxed text-[var(--ondeep)]">
            We want every school&apos;s experience to speak for itself. Talk with our team about the workflows you need to improve.
          </p>
          <Link href="/book-demo" className="mt-6 inline-flex rounded-full border border-white/50 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10">
            Book a school walkthrough
          </Link>
        </div>
      </div>
    </section>
  );
}
