import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Solutions", href: "/solutions" },
      { label: "Concierge", href: "/concierge" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Team", href: "/team" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides & Demos", href: "/resources" },
      { label: "Terms & Privacy", href: "/terms" },
      { label: "Log In", href: "/auth/login" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-promo">
          <div className="promo-card">
            <h4>Free for 30 days</h4>
            <p>
              Start using EduMyles today with no credit card. Full access to all modules during your trial.
            </p>
            <Link href="/auth/login" className="btn btn-primary btn-sm">
              Start Free Trial
            </Link>
          </div>
          <div className="promo-card">
            <h4>Talk to an Expert</h4>
            <p>
              Book a free session with our school-tech consultants to see how EduMyles fits your workflows.
            </p>
            <Link href="/concierge" className="btn btn-amber btn-sm">
              Book Consultation
            </Link>
          </div>
        </div>

        <div className="footer-columns">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-contact-info">
        <div className="contact-block">
          <h4>Headquarters</h4>
          <div className="contact-details">
            <div className="contact-item">
              <div>
                <span>Nairobi, Kenya</span>
                <span>Mylesoft Technologies Ltd</span>
              </div>
            </div>
          </div>
        </div>
        <div className="contact-block">
          <h4>Get in Touch</h4>
          <div className="contact-details">
            <div className="contact-emails">
              <a href="mailto:hello@edumyles.com">hello@edumyles.com</a>
              <a href="mailto:support@edumyles.com">support@edumyles.com</a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-legal">
        <div className="legal-links">
          <Link href="/terms">Terms of Service</Link>
          <span className="legal-divider">|</span>
          <Link href="/terms">Privacy Policy</Link>
          <span className="legal-divider">|</span>
          <Link href="/terms">Security</Link>
        </div>
        <p className="copyright">&copy; {new Date().getFullYear()} Mylesoft Technologies Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}
