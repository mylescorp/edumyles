"use client";

import { useState } from "react";
import Link from "next/link";

const featured = {
  category: "Product Update",
  title: "Introducing the All-New EduMyles 2026: Real-Time, Role-Based, and Built for Scale",
  excerpt:
    "We rebuilt EduMyles from the ground up with a real-time architecture, 11 deeply integrated modules, and a brand new interface. Here's everything that's new.",
  date: "March 2026",
  readTime: "8 min read",
  author: "EduMyles Team",
  slug: "#",
  tag: "New",
};

const posts = [
  {
    category: "Finance",
    title: "How to Set Up M-Pesa Fee Collection for Your School in Under 30 Minutes",
    excerpt: "A step-by-step guide to integrating M-Pesa Daraja into your EduMyles fee structure and going fully cashless.",
    date: "February 2026",
    readTime: "6 min read",
    author: "EduMyles Team",
    slug: "#",
    emoji: "💳",
  },
  {
    category: "CBC",
    title: "CBC Gradebook in EduMyles: A Complete Guide for Kenyan Schools",
    excerpt: "Everything you need to know about setting up competency-based assessment, learning areas, and strand reports.",
    date: "February 2026",
    readTime: "9 min read",
    author: "EduMyles Team",
    slug: "#",
    emoji: "📚",
  },
  {
    category: "School Management",
    title: "5 Signs Your School Has Outgrown Excel — And What to Do About It",
    excerpt: "From attendance confusion to fee arrears chaos, these are the warning signs every school administrator should watch for.",
    date: "January 2026",
    readTime: "5 min read",
    author: "EduMyles Team",
    slug: "#",
    emoji: "📊",
  },
  {
    category: "Parent Engagement",
    title: "How EduMyles Parent Portal Reduces SMS Costs by 60% While Improving Communication",
    excerpt: "Schools using the parent portal see fewer WhatsApp enquiries, faster fee payments, and more engaged parents.",
    date: "January 2026",
    readTime: "4 min read",
    author: "EduMyles Team",
    slug: "#",
    emoji: "👨‍👩‍👧",
  },
  {
    category: "Operations",
    title: "Timetable Generation: How EduMyles Creates Conflict-Free Schedules Automatically",
    excerpt: "The algorithm behind EduMyles timetable engine — and why it saves school coordinators 2 full days every term.",
    date: "December 2025",
    readTime: "7 min read",
    author: "EduMyles Team",
    slug: "#",
    emoji: "📅",
  },
  {
    category: "Regional",
    title: "School Management Software in Uganda: What's Different from Kenya",
    excerpt: "UNEB vs CBC, Airtel Money vs M-Pesa, Ugandan MoES requirements — here's what we adapted for Ugandan schools.",
    date: "December 2025",
    readTime: "6 min read",
    author: "EduMyles Team",
    slug: "#",
    emoji: "🇺🇬",
  },
];

const categories = ["All", "Product Update", "Finance", "CBC", "School Management", "Parent Engagement", "Operations", "Regional"];

export default function BlogContent() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [email, setEmail] = useState("");

  const visiblePosts = activeCategory === "All"
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* ── Category Filter ───────────────────────────────── */}
      <section className="py-8 px-4 border-b" style={{ background: "#ffffff", borderColor: "#e8f4ec" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="font-jakarta text-[13px] font-medium px-4 py-2 rounded-[50px] transition-all duration-200"
                style={
                  activeCategory === cat
                    ? { background: "#061A12", color: "#ffffff" }
                    : { background: "#F3FBF6", color: "#5a5a5a", border: "1px solid #d4eade" }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Post ─────────────────────────────────── */}
      {(activeCategory === "All" || activeCategory === "Product Update") && (
        <section className="py-12 px-4" style={{ background: "#F3FBF6" }}>
          <div className="max-w-[1200px] mx-auto">
            <div
              className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start"
              style={{
                background: "#061A12",
                border: "1px solid rgba(232,160,32,0.3)",
                boxShadow: "0 12px 40px rgba(6,26,18,0.2)",
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="font-jakarta font-bold text-[11px] px-3 py-1 rounded-[20px] uppercase tracking-wider"
                    style={{ background: "#E8A020", color: "#061A12" }}
                  >
                    {featured.tag}
                  </span>
                  <span className="font-jakarta text-[12px]" style={{ color: "#6B9E83" }}>{featured.category}</span>
                </div>
                <h2
                  className="font-playfair font-bold leading-[1.25] mb-4"
                  style={{ fontSize: "clamp(1.5rem,2.5vw,2.25rem)", color: "#ffffff" }}
                >
                  {featured.title}
                </h2>
                <p className="font-jakarta text-[15px] leading-[1.7] mb-6" style={{ color: "#A8E6C3" }}>
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>{featured.author}</span>
                  <span style={{ color: "#0F4C2A" }}>·</span>
                  <span className="font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>{featured.date}</span>
                  <span style={{ color: "#0F4C2A" }}>·</span>
                  <span className="font-jakarta text-[13px]" style={{ color: "#6B9E83" }}>{featured.readTime}</span>
                </div>
                <a
                  href={featured.slug}
                  className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline"
                  style={{ background: "#E8A020", color: "#061A12" }}
                >
                  Read Article →
                </a>
              </div>
              <div
                className="hidden md:flex w-[200px] h-[200px] flex-shrink-0 rounded-2xl items-center justify-center text-[80px]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,160,32,0.2)" }}
              >
                🚀
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Post Grid ─────────────────────────────────────── */}
      <section className="py-12 px-4 pb-16" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="font-playfair font-bold text-[24px] mb-8"
            style={{ color: "#061A12" }}
          >
            {activeCategory === "All" ? "Latest articles" : activeCategory}
          </h2>
          {visiblePosts.length === 0 ? (
            <p className="font-jakarta text-[15px] text-center py-12" style={{ color: "#8a8a8a" }}>
              No articles in this category yet. Check back soon.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePosts.map((post) => (
                <a
                  key={post.title}
                  href={post.slug}
                  className="rounded-2xl overflow-hidden flex flex-col no-underline group transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e8f4ec",
                    boxShadow: "0 2px 12px rgba(6,26,18,0.05)",
                  }}
                >
                  <div
                    className="flex items-center justify-center text-5xl"
                    style={{ background: "#F3FBF6", height: "160px", borderBottom: "1px solid #e8f4ec" }}
                  >
                    {post.emoji}
                  </div>
                  <div className="flex flex-col gap-3 p-6 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-jakarta font-semibold text-[11px] px-2.5 py-1 rounded-[20px]"
                        style={{ background: "rgba(232,160,32,0.1)", color: "#9A5D00" }}
                      >
                        {post.category}
                      </span>
                    </div>
                    <h3
                      className="font-playfair font-bold text-[17px] leading-[1.35] group-hover:text-[#E8A020] transition-colors"
                      style={{ color: "#061A12" }}
                    >
                      {post.title}
                    </h3>
                    <p className="font-jakarta text-[13px] leading-[1.7] flex-1" style={{ color: "#5a5a5a" }}>
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "#f0f0f0" }}>
                      <span className="font-jakarta text-[12px]" style={{ color: "#8a8a8a" }}>{post.date}</span>
                      <span style={{ color: "#d0d0d0" }}>·</span>
                      <span className="font-jakarta text-[12px]" style={{ color: "#8a8a8a" }}>{post.readTime}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#0C3020" }}>
        <div className="max-w-[660px] mx-auto text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2
            className="font-playfair font-bold leading-[1.2] mb-3"
            style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "#ffffff" }}
          >
            Stay in the loop
          </h2>
          <p className="font-jakarta text-[16px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
            Monthly insights on school management, product updates, and education technology in Africa. No spam.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
            className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your school email address"
              className="flex-1 font-jakarta text-[15px] px-5 py-3.5 rounded-[50px] outline-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
              }}
            />
            <button
              type="submit"
              className="font-jakarta font-bold text-[14px] px-6 py-3.5 rounded-[50px] flex-shrink-0"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Subscribe →
            </button>
          </form>
          <p className="font-jakarta text-[12px] mt-3" style={{ color: "#6B9E83" }}>
            Join 200+ school administrators. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#0F4C2A" }}>
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="font-playfair font-bold leading-[1.2] mb-4"
            style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "#ffffff" }}
          >
            Ready to run your school{" "}
            <em className="italic" style={{ color: "#E8A020" }}>better?</em>
          </h2>
          <p className="font-jakarta text-[16px] leading-[1.7] mb-7" style={{ color: "#A8E6C3" }}>
            Start your free 30-day trial. No credit card. No setup fees.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/signup/api"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Start Free Trial →
            </a>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[15px] px-8 py-4 rounded-[50px] no-underline"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              See All Features
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
