import Link from "next/link";

const articles = [
  {
    category: "Operations",
    title: "5 Signs Your School Needs a Management System",
    excerpt: "Still using spreadsheets and WhatsApp? Here are the telltale signs it is time to digitize your school operations and how to make the transition smooth.",
    author: "EduMyles Team",
    date: "Feb 2025",
    readTime: "5 min",
  },
  {
    category: "Finance",
    title: "How Mobile Money is Transforming School Fee Collection in East Africa",
    excerpt: "M-Pesa and Airtel Money have changed how parents pay school fees. Learn how to leverage these tools for faster collections and better cash flow visibility.",
    author: "EduMyles Team",
    date: "Jan 2025",
    readTime: "7 min",
  },
  {
    category: "Academics",
    title: "Implementing CBC Grading: A Practical Guide for Schools",
    excerpt: "The Competency-Based Curriculum requires new assessment approaches. Here is a step-by-step guide to setting up CBC grading that actually works.",
    author: "EduMyles Team",
    date: "Dec 2024",
    readTime: "6 min",
  },
  {
    category: "Operations",
    title: "The Multi-Campus Challenge: Managing Multiple Schools from One Dashboard",
    excerpt: "School groups face unique challenges around data isolation, staff sharing, and consolidated reporting. Here is how to solve them.",
    author: "EduMyles Team",
    date: "Nov 2024",
    readTime: "8 min",
  },
  {
    category: "Finance",
    title: "Reducing Fee Defaulters by 30%: A Data-Driven Approach",
    excerpt: "Automated reminders, flexible payment plans, and real-time visibility can dramatically improve your fee collection rates. Here is the playbook.",
    author: "EduMyles Team",
    date: "Oct 2024",
    readTime: "5 min",
  },
  {
    category: "Academics",
    title: "Digital Report Cards: From Template to Delivery in 10 Minutes",
    excerpt: "Stop spending weekends formatting report cards. With the right system, generation and delivery to parents can take minutes, not days.",
    author: "EduMyles Team",
    date: "Sep 2024",
    readTime: "4 min",
  },
];

export default function BlogPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Blog</p>
          <h1>Insights from School Operations</h1>
          <p className="subtext">
            Practical thinking on finance, academics, administration, and digital transformation
            for schools across East Africa.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="content-section">
        <div className="content-inner">
          <div className="blog-featured">
            <div className="blog-featured-image">
              <div className="blog-featured-placeholder">
                <span className="blog-category-badge">Featured</span>
              </div>
            </div>
            <div className="blog-featured-content">
              <span className="blog-category-badge small">Operations</span>
              <h2>The Future of School Management in Africa: 2025 and Beyond</h2>
              <p>
                From AI-powered analytics to mobile-first portals, the landscape of school management
                technology is evolving rapidly. We explore the trends shaping how African schools will
                operate in the coming years and what administrators should prepare for.
              </p>
              <div className="blog-meta">
                <div className="blog-author">
                  <div className="blog-author-avatar">ET</div>
                  <div>
                    <span className="blog-author-name">EduMyles Team</span>
                    <span className="blog-author-role">March 2025</span>
                  </div>
                </div>
                <span className="blog-date-info">10 min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Latest Articles</h2>
          </div>
          <div className="blog-grid">
            {articles.map((article) => (
              <div key={article.title} className="blog-card">
                <div className="blog-card-image">
                  <div className="blog-card-placeholder">
                    <span className="blog-category-badge small">{article.category}</span>
                  </div>
                </div>
                <div className="blog-card-content">
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className="blog-card-meta">
                    <div className="blog-card-author">
                      <div className="blog-author-avatar small">{article.author[0]}</div>
                      <span className="blog-author-name" style={{ fontSize: "0.8rem" }}>{article.author}</span>
                    </div>
                    <span className="blog-date-info">{article.date} <span className="blog-dot">&middot;</span> {article.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="newsletter-block">
            <div className="newsletter-text">
              <h2>Stay updated</h2>
              <p>
                Get practical insights on school operations, ed-tech trends, and product updates
                delivered to your inbox. No spam, just value.
              </p>
              <Link className="btn btn-amber" href="/contact">
                Subscribe to Updates
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to modernize your school?</h2>
          <p>Start your free 30-day trial and see the difference firsthand.</p>
          <Link className="btn btn-primary" href="/auth/login">Get Started Free</Link>
        </div>
      </section>
    </main>
  );
}
