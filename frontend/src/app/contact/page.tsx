import Link from "next/link";

export default function ContactPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Contact</p>
          <h1>Get in Touch with EduMyles</h1>
          <p className="subtext">
            Whether you need sales guidance, technical support, or want to explore a partnership -
            our team is here to help.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="content-inner">
          <div className="contact-options-grid">
            <div className="contact-option-card highlighted">
              <h3>Sales</h3>
              <p>
                Discuss which plan fits your school, get a personalized demo, and explore deployment options.
              </p>
              <div className="contact-detail-list">
                <div className="contact-detail">
                  <strong>Email</strong>
                  <a href="mailto:sales@edumyles.com">sales@edumyles.com</a>
                </div>
                <div className="contact-detail">
                  <strong>Response Time</strong>
                  <span style={{ fontSize: "0.9rem", color: "var(--charcoal)" }}>Within 4 hours</span>
                </div>
              </div>
              <Link className="btn btn-primary" href="/concierge">Book a Demo</Link>
            </div>

            <div className="contact-option-card">
              <h3>Support</h3>
              <p>
                Get help with your current setup, troubleshoot issues, and optimize your workflows.
              </p>
              <div className="contact-detail-list">
                <div className="contact-detail">
                  <strong>Email</strong>
                  <a href="mailto:support@edumyles.com">support@edumyles.com</a>
                </div>
                <div className="contact-detail">
                  <strong>Response Time</strong>
                  <span style={{ fontSize: "0.9rem", color: "var(--charcoal)" }}>Within 2 hours (Standard+)</span>
                </div>
              </div>
              <Link className="btn btn-outline" href="mailto:support@edumyles.com">Email Support</Link>
            </div>

            <div className="contact-option-card">
              <h3>Partnerships</h3>
              <p>
                Explore integration opportunities, reseller programs, and co-marketing initiatives.
              </p>
              <div className="contact-detail-list">
                <div className="contact-detail">
                  <strong>Email</strong>
                  <a href="mailto:partners@edumyles.com">partners@edumyles.com</a>
                </div>
                <div className="contact-detail">
                  <strong>For</strong>
                  <span style={{ fontSize: "0.9rem", color: "var(--charcoal)" }}>Ed-tech providers, integrators</span>
                </div>
              </div>
              <Link className="btn btn-outline" href="mailto:partners@edumyles.com">Start Conversation</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Quick contacts</h2>
          </div>
          <div className="contact-info-grid">
            <div className="contact-info-card">
              <h4>General Enquiries</h4>
              <a href="mailto:hello@edumyles.com">hello@edumyles.com</a>
              <p>For general questions about EduMyles</p>
            </div>
            <div className="contact-info-card">
              <h4>Technical Support</h4>
              <a href="mailto:support@edumyles.com">support@edumyles.com</a>
              <p>Help with platform issues and setup</p>
            </div>
            <div className="contact-info-card">
              <h4>Billing</h4>
              <a href="mailto:billing@edumyles.com">billing@edumyles.com</a>
              <p>Invoices, payments, and plan changes</p>
            </div>
            <div className="contact-info-card">
              <h4>Careers</h4>
              <a href="mailto:careers@edumyles.com">careers@edumyles.com</a>
              <p>Join our team and make an impact</p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="office-block">
            <div className="office-info">
              <h2>Our Office</h2>
              <div className="office-details">
                <div className="office-detail">
                  <div>
                    <strong>Mylesoft Technologies Ltd</strong>
                    <p>Nairobi, Kenya</p>
                  </div>
                </div>
                <div className="office-detail">
                  <div>
                    <strong>Email</strong>
                    <a href="mailto:hello@edumyles.com">hello@edumyles.com</a>
                  </div>
                </div>
                <div className="office-detail">
                  <div>
                    <strong>Operating Hours</strong>
                    <p>Mon - Fri: 8:00 AM - 6:00 PM (EAT)</p>
                    <p>Saturday: 9:00 AM - 1:00 PM (EAT)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to get started?</h2>
          <p>Start your free trial today or book a personalized demo with our team.</p>
          <div className="centered-actions">
            <Link className="btn btn-primary" href="/auth/login">Start Free Trial</Link>
            <Link className="btn btn-outline" href="/concierge">Book a Demo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
