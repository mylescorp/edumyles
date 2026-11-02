import type { Metadata } from "next";
import BlogContent from "./BlogContent";

export const metadata: Metadata = {
  title: "Blog — EduMyles School Management Insights",
  description:
    "Insights, guides, and resources for school administrators, teachers, and education leaders across East Africa — Kenya, Uganda, Tanzania, Rwanda, and Zambia.",
};

export default function BlogPage() {
  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--color-surface-default)",
          borderTop: "3px solid var(--color-action-primary)",
          padding: "4rem 2rem 3rem",
          minHeight: "300px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full text-center">
          <div
            className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
            style={{
              background: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
              border: "1px solid var(--color-text-on-primary-subtle)",
              color: "var(--color-text-on-primary-subtle)",
            }}
          >
            EduMyles Blog
          </div>
          <h1
            className="font-display font-bold leading-[1.15] mb-5"
            style={{ fontSize: "clamp(2.2rem,4.5vw,3.75rem)", color: "var(--color-text-default)" }}
          >
            Insights for{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
              African schools.
            </em>
          </h1>
          <p
            className="font-jakarta font-light leading-[1.8] mx-auto"
            style={{ fontSize: "18px", color: "var(--color-text-muted)", maxWidth: "540px" }}
          >
            Guides, product updates, and resources for school administrators, teachers, and
            education leaders.
          </p>
        </div>
      </section>

      {/* ── Interactive content (filter, posts, newsletter) ── */}
      <BlogContent />
    </div>
  );
}
