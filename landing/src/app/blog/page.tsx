import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — EduMyles",
  description:
    "Insights, guides, and updates from the EduMyles team on school management, EdTech in Africa, and product updates.",
};

const featuredPost = {
  slug: "why-east-african-schools-need-digital-transformation",
  title: "Why East African Schools Need Digital Transformation in 2026",
  excerpt:
    "Schools across Kenya, Uganda, and Tanzania still rely on spreadsheets and WhatsApp groups. Here\u2019s why that\u2019s costing them — and what the path forward looks like.",
  author: "Jonathan Myles",
  authorRole: "CEO & Founder",
  authorInitials: "JM",
  date: "28 Feb 2026",
  category: "Industry",
  readTime: "8 min read",
};

const posts = [
  {
    slug: "how-to-collect-school-fees-with-mpesa",
    title: "How to Collect School Fees with M-Pesa: A Complete Guide",
    excerpt:
      "Step-by-step guide to setting up automated fee collection using M-Pesa\u2019s Daraja API, with real examples from Kenyan schools.",
    author: "Nalini Wafula",
    authorInitials: "NW",
    date: "22 Feb 2026",
    category: "Guides",
    readTime: "6 min read",
  },
  {
    slug: "edumyles-q1-2026-product-update",
    title: "EduMyles Q1 2026: What\u2019s New",
    excerpt:
      "Multi-campus dashboards, improved timetable generation, and the new partner white-label programme. Here\u2019s everything we shipped this quarter.",
    author: "Fatima Abdi",
    authorInitials: "FA",
    date: "15 Feb 2026",
    category: "Product Updates",
    readTime: "5 min read",
  },
  {
    slug: "cbc-report-cards-digital-guide",
    title: "Generating CBC Report Cards Digitally: What Schools Need to Know",
    excerpt:
      "Kenya\u2019s Competency-Based Curriculum requires a new report card format. Here\u2019s how EduMyles handles it automatically.",
    author: "Wanjiku Kamau",
    authorInitials: "WK",
    date: "8 Feb 2026",
    category: "Guides",
    readTime: "7 min read",
  },
  {
    slug: "multi-campus-management-best-practices",
    title: "Managing Multiple Campuses from One Dashboard",
    excerpt:
      "School groups face unique challenges: data isolation, standardised reporting, and cross-campus transfers. Here\u2019s how to solve them.",
    author: "Kwame Asante",
    authorInitials: "KA",
    date: "1 Feb 2026",
    category: "Best Practices",
    readTime: "6 min read",
  },
  {
    slug: "partner-programme-launch",
    title: "Introducing the EduMyles Partner Programme",
    excerpt:
      "EdTech providers and consultancies can now offer EduMyles under their own brand with full white-label and API access. Here\u2019s how it works.",
    author: "Baraka Mwenda",
    authorInitials: "BM",
    date: "25 Jan 2026",
    category: "Announcements",
    readTime: "4 min read",
  },
  {
    slug: "school-data-migration-guide",
    title: "How to Migrate Your School Data to EduMyles Without Losing Anything",
    excerpt:
      "Moving from spreadsheets to a proper platform is daunting. Here\u2019s our step-by-step playbook for zero-data-loss migration.",
    author: "Mugisha Uwimana",
    authorInitials: "MU",
    date: "18 Jan 2026",
    category: "Guides",
    readTime: "8 min read",
  },
  {
    slug: "reducing-late-fee-payments",
    title: "5 Strategies to Reduce Late Fee Payments at Your School",
    excerpt:
      "From automated reminders to flexible payment plans, these are the tactics that actually work for East African schools.",
    author: "Zuri Nyambura",
    authorInitials: "ZN",
    date: "10 Jan 2026",
    category: "Best Practices",
    readTime: "5 min read",
  },
  {
    slug: "offline-first-school-management",
    title: "Why Offline-First Matters for School Management in Africa",
    excerpt:
      "Internet connectivity in East Africa is improving but still unreliable. How we designed EduMyles to work even when the WiFi doesn\u2019t.",
    author: "Amara Diallo",
    authorInitials: "AD",
    date: "3 Jan 2026",
    category: "Engineering",
    readTime: "7 min read",
  },
];

const categories = ["All", "Guides", "Product Updates", "Best Practices", "Industry", "Announcements", "Engineering"];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Blog</p>
          <h1>Insights for school leaders.</h1>
          <p className="subtext">
            Guides, product updates, and perspectives on school management and
            EdTech in East Africa — from the EduMyles team.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="content-section blog-categories-section">
        <div className="content-inner">
          <div className="blog-categories">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`blog-category-tag ${cat === "All" ? "active" : ""}`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="content-section">
        <div className="content-inner">
          <div className="blog-featured">
            <div className="blog-featured-image">
              <div className="blog-featured-placeholder">
                <span className="blog-category-badge">{featuredPost.category}</span>
              </div>
            </div>
            <div className="blog-featured-content">
              <span className="blog-category-badge">{featuredPost.category}</span>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
              <div className="blog-meta">
                <div className="blog-author">
                  <span className="blog-author-avatar">{featuredPost.authorInitials}</span>
                  <div>
                    <span className="blog-author-name">{featuredPost.author}</span>
                    <span className="blog-author-role">{featuredPost.authorRole}</span>
                  </div>
                </div>
                <div className="blog-date-info">
                  <span>{featuredPost.date}</span>
                  <span className="blog-dot">&middot;</span>
                  <span>{featuredPost.readTime}</span>
                </div>
              </div>
              <Link className="btn btn-primary" href={`/blog`}>
                Read Article
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header">
            <h2>Latest Articles</h2>
          </div>
          <div className="blog-grid">
            {posts.map((post) => (
              <article key={post.slug} className="blog-card">
                <div className="blog-card-image">
                  <div className="blog-card-placeholder">
                    <span className="blog-category-badge small">{post.category}</span>
                  </div>
                </div>
                <div className="blog-card-content">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="blog-card-meta">
                    <div className="blog-card-author">
                      <span className="blog-author-avatar small">{post.authorInitials}</span>
                      <span className="blog-author-name">{post.author}</span>
                    </div>
                    <div className="blog-date-info">
                      <span>{post.date}</span>
                      <span className="blog-dot">&middot;</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="newsletter-block">
            <div className="newsletter-text">
              <h2>Into the Zone</h2>
              <p>
                Subscribe to our monthly newsletter for product updates, school
                management tips, and the latest from the EduMyles team. Join
                500+ school leaders already reading.
              </p>
              <a className="btn btn-amber" href="mailto:info@edumyles.com?subject=Newsletter%20Subscription">
                Subscribe to Newsletter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to try EduMyles?</h2>
          <p>Start your free trial and see why 50+ schools trust us.</p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="/contact">
              Activate Free Trial
            </Link>
            <Link className="btn btn-secondary" href="/concierge">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
