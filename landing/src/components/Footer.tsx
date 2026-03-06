import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
};

const quickLinks: FooterLink[] = [
  { label: "Getting Started", href: "/resources#guides" },
  { label: "Product Videos", href: "/resources#videos" },
  { label: "Integrations Guide", href: "/features#integrations" },
  { label: "Webinars", href: "/resources#webinars" },
  { label: "Pricing FAQs", href: "/pricing#faq" },
  { label: "Module FAQs", href: "/features#modules" },
  { label: "EduMyles Terms", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
  { label: "sales@edumyles.com", href: "mailto:sales@edumyles.com" },
  { label: "+254 743 993 715", href: "tel:+254743993715" },
];

const exploreLinks: FooterLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "Why EduMyles?", href: "/features#platform" },
  { label: "EduMyles for Small Schools", href: "/solutions#primary" },
  { label: "Concierge", href: "/concierge" },
  { label: "Support Plans", href: "/pricing#support" },
  { label: "Newsletter", href: "/resources#newsletter" },
  { label: "WesternHeights, Nairobi, Kenya", href: "/contact" },
];

const partnerLinks: FooterLink[] = [
  { label: "Partner Program", href: "/solutions#partners" },
  { label: "Find a Partner", href: "/contact" },
  { label: "Become a Partner", href: "/contact" },
  { label: "EduMyles Affiliate", href: "/contact" },
  { label: "EduMyles for Startups", href: "/solutions#primary" },
  { label: "EduMyles Marketplace", href: "/features#integrations" },
  { label: "support@edumyles.com", href: "mailto:support@edumyles.com" },
  { label: "+254 751 812 884", href: "tel:+254751812884" },
];

const legalLinks: FooterLink[] = [
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

function FooterLinkItem({ link }: { link: FooterLink }) {
  const isSpecialLink = link.href.startsWith("mailto:") || link.href.startsWith("tel:");

  if (isSpecialLink) {
    return <a href={link.href}>{link.label}</a>;
  }

  return <Link href={link.href}>{link.label}</Link>;
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
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

        <div className="footer-columns">
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Explore EduMyles</h4>
            <ul>
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Partner Zone</h4>
            <ul>
              {partnerLinks.map((link) => (
                <li key={link.label}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-legal">
        <div className="legal-links">
          {legalLinks.map((link, i) => (
            <span key={link.label}>
              <FooterLinkItem link={link} />
              {i < legalLinks.length - 1 && <span className="legal-divider">|</span>}
            </span>
          ))}
        </div>

        <p className="copyright">
          &copy; 2026 EduMyles. Built for East Africa. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
