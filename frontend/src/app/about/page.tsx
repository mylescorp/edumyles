import Link from "next/link";
import FounderImage from "@/components/landing/FounderImage";

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="page-hero green-hero">
        <div className="page-hero-inner">
          <p className="eyebrow light">About EduMyles</p>
          <h1 className="light-heading">Built for Schools Across East Africa</h1>
          <p className="subtext light">
            EduMyles exists to make school management efficient, connected, and accountable. We are a
            team of engineers, educators, and operators building software that schools can trust.
          </p>
          <div className="actions">
            <Link className="btn btn-amber" href="/auth/signup">
              Get Started Free
            </Link>
            <Link className="btn btn-outline-light" href="/concierge">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="content-section">
        <div className="content-inner">
          <div className="about-mission-block">
            <div className="about-mission-text">
              <h2>Our Mission</h2>
              <p className="about-lead">
                To empower schools across Africa with intuitive, affordable technology that simplifies
                administration, enhances learning outcomes, and connects every stakeholder in the
                education journey.
              </p>
              <p>
                We believe that every school, regardless of size or location, deserves access to
                modern management tools. Too many schools still rely on spreadsheets, WhatsApp groups,
                and manual processes to run their operations. EduMyles changes that by providing one
                unified platform that handles admissions, academics, finance, HR, and communication -
                all built specifically for the way African schools work.
              </p>
            </div>
            <div className="about-mission-stats">
              <div className="about-stat">
                <span className="about-stat-value">50+</span>
                <span className="about-stat-label">Schools on platform</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">6</span>
                <span className="about-stat-label">Countries supported</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">11</span>
                <span className="about-stat-label">Core modules</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">10K+</span>
                <span className="about-stat-label">Students managed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Our Vision</h2>
            <p className="section-subtitle">
              A world where every school, regardless of size or location, has access to world-class
              technology to deliver transformative education.
            </p>
          </div>
          <div className="features-grid three-col">
            <div className="feature-card">
              <h3>Local-First Design</h3>
              <p>
                Built from the ground up for East African workflows - M-Pesa integration, CBC curriculum
                support, and multi-currency billing.
              </p>
            </div>
            <div className="feature-card">
              <h3>Affordable for All</h3>
              <p>
                Pricing that scales with your school size. Start free and grow into Standard or Pro as
                your needs expand. No upfront costs.
              </p>
            </div>
            <div className="feature-card">
              <h3>Built for Scale</h3>
              <p>
                Whether you run one school or twenty, EduMyles handles multi-campus operations with strict
                data isolation and central oversight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The MYLES Principle */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>The M.Y.L.E.S. Principle</h2>
            <p className="section-subtitle">
              Our core values framework that drives every product decision and customer interaction.
            </p>
          </div>
          <div className="features-grid three-col">
            <div className="feature-card">
              <h3>M - Mastery</h3>
              <p>Pursue excellence relentlessly in how we build, ship, and serve.</p>
            </div>
            <div className="feature-card">
              <h3>Y - Youth Empowerment</h3>
              <p>Design every decision to unlock the potential of Africa&apos;s young people.</p>
            </div>
            <div className="feature-card">
              <h3>L - Leadership</h3>
              <p>Lead with integrity, courage, and accountability to every stakeholder.</p>
            </div>
            <div className="feature-card">
              <h3>E - Entrepreneurship</h3>
              <p>Think like founders - innovate boldly, own outcomes fully.</p>
            </div>
            <div className="feature-card">
              <h3>S - Service</h3>
              <p>Serve schools, students, and communities with purpose, humility, and heart.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Meet the Founders</h2>
            <p className="section-subtitle">
              EduMyles was born from a shared belief that African schools deserve world-class
              technology built by people who understand their reality.
            </p>
          </div>

          <div className="founder-block" style={{ marginBottom: "3rem" }}>
            <div className="founder-image">
              <FounderImage alt="Jonathan Myles - CEO & Founder" initials="JM" />
            </div>
            <div className="founder-text">
              <p className="eyebrow">CEO &amp; Founder</p>
              <h2>Jonathan Myles</h2>
              <p className="founder-bio">
                Jonathan is a full-stack software engineer with deep expertise in building scalable
                web applications and distributed systems. With years of experience shipping products
                across fintech and ed-tech, he founded EduMyles after witnessing firsthand how
                schools across East Africa struggled with fragmented, outdated management tools.
              </p>
              <p className="founder-bio">
                His engineering background spans React, Next.js, Node.js, and cloud infrastructure -
                the same stack that powers EduMyles today. Jonathan leads product development and
                technical architecture, ensuring the platform is reliable, performant, and built to
                scale across multiple countries and currencies.
              </p>
              <p className="founder-bio">
                &ldquo;Every school deserves technology that works as hard as its teachers do. We are
                building EduMyles to be that technology - intuitive, reliable, and built for Africa.&rdquo;
              </p>
              <div className="founder-location">Nairobi, Kenya</div>
            </div>
          </div>

          <div className="founder-block" style={{ direction: "rtl" }}>
            <div className="founder-image" style={{ direction: "ltr" }}>
              <FounderImage alt="Pauline Moraa - Co-Founder & COO" initials="PM" />
            </div>
            <div className="founder-text" style={{ direction: "ltr" }}>
              <p className="eyebrow">Co-Founder &amp; COO</p>
              <h2>Pauline Moraa</h2>
              <p className="founder-bio">
                Pauline brings a strong background in sales and business operations to EduMyles.
                With experience driving growth across B2B and enterprise markets in East Africa,
                she understands the challenges schools face when adopting new technology - and how
                to make the transition seamless.
              </p>
              <p className="founder-bio">
                As COO, Pauline oversees go-to-market strategy, partnerships, customer success,
                and daily operations. She has built the school onboarding process from the ground
                up, ensuring that every institution gets hands-on support during setup and training.
                Her operational acumen keeps EduMyles running efficiently while scaling to new markets.
              </p>
              <p className="founder-bio">
                &ldquo;Schools don&apos;t just need software - they need a partner who understands their
                operations. We walk alongside every school we serve, from first demo to full adoption.&rdquo;
              </p>
              <div className="founder-location">Nairobi, Kenya</div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Our Journey</h2>
          </div>
          <div className="timeline">
            {[
              { year: "2022", title: "The Spark", text: "Identified the gap in school management software for East African institutions." },
              { year: "2023", title: "MVP Launch", text: "Built first version with core student management, fee tracking, and M-Pesa. Onboarded 10 pilot schools in Kenya." },
              { year: "2024", title: "Platform Expansion", text: "Grew to 11 modules, expanded to Uganda and Tanzania, launched stakeholder portals." },
              { year: "2025", title: "East Africa-Wide", text: "Serving 50+ schools across 6 countries with full CBC/8-4-4 support and marketplace modules." },
            ].map((item) => (
              <div key={item.year} className="timeline-item">
                <div className="timeline-year">{item.year}</div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Join the schools transforming education in Africa</h2>
          <p>Start your free 30-day trial today. No credit card required.</p>
          <Link className="btn btn-primary" href="/auth/signup">
            Get Started Free
          </Link>
        </div>
      </section>
    </main>
  );
}
