import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact & Get Started — EduMyles",
  description:
    "Get in touch with EduMyles. Start your free trial, contact sales, or reach our support team.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Get Started</p>
          <h1>Let&apos;s get your school running on EduMyles.</h1>
          <p className="subtext">
            Start a free trial, book a demo, or reach out to our team — we&apos;re
            here to help you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="content-section">
        <div className="content-inner">
          <div className="contact-options-grid">
            {/* Free Trial */}
            <div className="contact-option-card highlighted">
              <h3>Start Free Trial</h3>
              <p>
                Get full access to EduMyles Starter for free — no credit card,
                no commitment. Set up your school in minutes.
              </p>
              <ul className="module-features-list">
                <li><span className="check-icon">&#10003;</span> Free for 30 days</li>
                <li><span className="check-icon">&#10003;</span> No credit card required</li>
                <li><span className="check-icon">&#10003;</span> Free onboarding support</li>
                <li><span className="check-icon">&#10003;</span> Cancel anytime</li>
              </ul>
              <a
                className="btn btn-primary"
                href="mailto:sales@edumyles.com?subject=Free%20Trial%20Request&body=Hi%20EduMyles%20Team%2C%0A%0AI%27d%20like%20to%20start%20a%20free%20trial.%0A%0ASchool%20Name%3A%20%0ALocation%3A%20%0ANumber%20of%20Students%3A%20%0AContact%20Person%3A%20%0APhone%3A%20%0A%0AThank%20you!"
              >
                Activate Free Trial
              </a>
            </div>

            {/* Contact Sales */}
            <div className="contact-option-card">
              <h3>Contact Sales</h3>
              <p>
                Have questions about pricing, enterprise plans, or the partner
                programme? Our sales team can help.
              </p>
              <div className="contact-detail-list">
                <div className="contact-detail">
                  <strong>Email</strong>
                  <a href="mailto:sales@edumyles.com">sales@edumyles.com</a>
                </div>
                <div className="contact-detail">
                  <strong>Phone</strong>
                  <a href="tel:+254743993715">+254 743 993 715</a>
                </div>
              </div>
              <a className="btn btn-secondary" href="mailto:sales@edumyles.com?subject=Sales%20Inquiry">
                Email Sales Team
              </a>
            </div>

            {/* Book a Demo */}
            <div className="contact-option-card">
              <h3>Book a Demo</h3>
              <p>
                See EduMyles in action with a personalised walkthrough from our
                school-tech experts. Not a sales pitch — a genuine consultation.
              </p>
              <div className="contact-detail-list">
                <div className="contact-detail">
                  <strong>Email</strong>
                  <a href="mailto:contact@edumyles.com">contact@edumyles.com</a>
                </div>
                <div className="contact-detail">
                  <strong>Phone</strong>
                  <a href="tel:+254743993715">+254 743 993 715</a>
                </div>
              </div>
              <a className="btn btn-secondary" href="mailto:contact@edumyles.com?subject=Demo%20Request">
                Book Consultation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Full Contact Info */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Contact Information</h2>
          </div>
          <div className="contact-info-grid">
            <div className="contact-info-card">
              <h4>Sales</h4>
              <a href="mailto:sales@edumyles.com">sales@edumyles.com</a>
              <p>Pricing, plans, enterprise, and partner enquiries.</p>
            </div>
            <div className="contact-info-card">
              <h4>Support</h4>
              <a href="mailto:support@edumyles.com">support@edumyles.com</a>
              <p>Technical support for existing customers.</p>
            </div>
            <div className="contact-info-card">
              <h4>General</h4>
              <a href="mailto:contact@edumyles.com">contact@edumyles.com</a>
              <p>General enquiries, press, and partnerships.</p>
            </div>
            <div className="contact-info-card">
              <h4>Info</h4>
              <a href="mailto:info@edumyles.com">info@edumyles.com</a>
              <p>Newsletter, media kits, and resources.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Office & Phone */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="office-block">
            <div className="office-info">
              <h2>Our Office</h2>
              <div className="office-details">
                <div className="office-detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <div>
                    <strong>WesternHeights</strong>
                    <p>Nairobi, Kenya</p>
                  </div>
                </div>
                <div className="office-detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                  <div>
                    <a href="tel:+254743993715">+254 743 993 715</a>
                    <a href="tel:+254743993715">+254 743 993 715</a>
                  </div>
                </div>
                <div className="office-detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  <div>
                    <a href="mailto:contact@edumyles.com">contact@edumyles.com</a>
                    <a href="mailto:info@edumyles.com">info@edumyles.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to transform your school?</h2>
          <p>Start your free trial today or talk to our team.</p>
          <div className="actions centered-actions">
            <a
              className="btn btn-primary"
              href="mailto:sales@edumyles.com?subject=Free%20Trial%20Request"
            >
              Activate Free Trial
            </a>
            <a className="btn btn-secondary" href="tel:+254743993715">
              Call Us Now
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
