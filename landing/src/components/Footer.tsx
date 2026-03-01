import Link from "next/link";

const quickLinks = [
  { label: "Getting Started", href: "/resources#guides" },
  { label: "Product Videos", href: "/resources#videos" },
  { label: "Integrations Guide", href: "/features#integrations" },
  { label: "Webinars", href: "/resources#webinars" },
  { label: "Pricing FAQs", href: "/pricing#faq" },
  { label: "Module FAQs", href: "/features#modules" },
  { label: "EduMyles Terms", href: "/terms" },
  { label: "EduMyles Affiliate", href: "/contact" },
  { label: "EduMyles for Startups", href: "/solutions#primary" },
  { label: "EduMyles Marketplace", href: "/features#integrations" },
];

const exploreLinks = [
  { label: "About Us", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "Why EduMyles?", href: "/features#platform" },
  { label: "EduMyles for Small Schools", href: "/solutions#primary" },
  { label: "Concierge", href: "/concierge" },
  { label: "Support Plans", href: "/pricing#support" },
  { label: "Newsletter", href: "/resources#newsletter" },
];

const partnerLinks = [
  { label: "Partner Program", href: "/solutions#partners" },
  { label: "Find a Partner", href: "/contact" },
  { label: "Become a Partner", href: "/contact" },
];

const legalLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Security", href: "/terms" },
  { label: "Compliance", href: "/terms" },
  { label: "IPR Complaints", href: "/terms" },
  { label: "Anti-spam Policy", href: "/terms" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/terms" },
  { label: "Trademark Policy", href: "/terms" },
  { label: "Cookie Policy", href: "/terms" },
  { label: "GDPR Compliance", href: "/terms" },
  { label: "Abuse Policy", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        {/* Promo Cards */}
        <div className="footer-promo">
          <div className="promo-card">
            <h4>Workshops</h4>
            <p>Live training events to help your team get the most out of EduMyles.</p>
            <Link href="/resources#webinars" className="btn btn-sm btn-amber">
              Learn More
            </Link>
          </div>
          <div className="promo-card">
            <h4>Live Webinars</h4>
            <p>Join upcoming sessions to see new features and best practices in action.</p>
            <Link href="/resources#webinars" className="btn btn-sm btn-amber">
              Save Your Seat
            </Link>
          </div>
        </div>

        {/* Link Columns */}
        <div className="footer-columns">
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Explore EduMyles</h4>
            <ul>
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Partner Zone</h4>
            <ul>
              {partnerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Info Strip */}
      <div className="footer-contact-info">
        <div className="contact-block">
          <h4>Contact</h4>
          <div className="contact-details">
            <div className="contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
              <div>
                <a href="tel:+254743993715">+254 743 993 715</a>
                <a href="tel:+254751812884">+254 751 812 884</a>
              </div>
            </div>
            <div className="contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span>WesternHeights, Nairobi, Kenya</span>
            </div>
          </div>
        </div>
        <div className="contact-block">
          <h4>Email</h4>
          <div className="contact-emails">
            <a href="mailto:sales@edumyles.com">sales@edumyles.com</a>
            <a href="mailto:support@edumyles.com">support@edumyles.com</a>
            <a href="mailto:contact@edumyles.com">contact@edumyles.com</a>
            <a href="mailto:info@edumyles.com">info@edumyles.com</a>
          </div>
        </div>
      </div>

      {/* Social & Main Contact */}
      <div className="footer-contact">
        <a href="mailto:support@edumyles.com" className="footer-email">
          support@edumyles.com
        </a>
        <div className="footer-social">
          <a href="https://x.com" aria-label="Twitter / X" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          </a>
          <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
          </a>
          <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
          </a>
          <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" /></svg>
          </a>
        </div>
      </div>

      {/* Legal */}
      <div className="footer-legal">
        <div className="legal-links">
          {legalLinks.map((link, i) => (
            <span key={link.label}>
              <Link href={link.href}>{link.label}</Link>
              {i < legalLinks.length - 1 && <span className="legal-divider">|</span>}
            </span>
          ))}
        </div>
        <p className="copyright">
          &copy; {new Date().getFullYear()} EduMyles. Built for East Africa. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
