"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";

const productsLinks = [
  { label: "EduMyles", href: "/products/edumyles" },
  { label: "EduRyde", href: "/products/eduryde" },
  { label: "MylesCare", href: "/products/mylescare" },
  { label: "MylesCRM", href: "/products/mylescrm" },
  { label: "AgriMyles", href: "/products/agrimyles" },
  { label: "Myles AI", href: "/products/myles-ai" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
  { label: "Press", href: "/press" },
  { label: "Partners", href: "/partners" },
];

const solutionsLinks = [
  { label: "Education", href: "/solutions/education" },
  { label: "Healthcare", href: "/solutions/healthcare" },
  { label: "Agriculture", href: "/solutions/agriculture" },
  { label: "Business", href: "/solutions/business" },
  { label: "Government", href: "/solutions/government" },
];

const supportLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Book a Demo", href: "/book-demo" },
  { label: "Documentation", href: "/docs" },
  { label: "API Reference", href: "/api" },
  { label: "Status Page", href: "/status" },
];

const legalLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Security", href: "/security" },
  { label: "Compliance", href: "/compliance" },
];

const socialLinks = [
  { icon: <Facebook size={20} />, href: "https://facebook.com/mylesoft", label: "Facebook" },
  { icon: <Twitter size={20} />, href: "https://twitter.com/mylesoft", label: "Twitter" },
  { icon: <Linkedin size={20} />, href: "https://linkedin.com/company/mylesoft", label: "LinkedIn" },
  { icon: <Instagram size={20} />, href: "https://instagram.com/mylesoft", label: "Instagram" },
  { icon: <Youtube size={20} />, href: "https://youtube.com/@mylesoft", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          {/* Company Info */}
          <div className="footer-col company-col">
            <div className="footer-logo">
              <h3>Mylesoft</h3>
              <p>Transforming businesses across East Africa with innovative software solutions.</p>
            </div>
            
            <div className="footer-contact">
              <div className="contact-item">
                <Phone size={16} />
                <a href="tel:+254743993715">+254 743 993 715</a>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <a href="mailto:info@mylesoft.com">info@mylesoft.com</a>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>Western Heights, Nairobi, Kenya</span>
              </div>
            </div>

            <div className="footer-social">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="footer-col">
            <h4>Products</h4>
            <ul>
              {productsLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="footer-col">
            <h4>Solutions</h4>
            <ul>
              {solutionsLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Support */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
            
            <h4 className="mt-8">Support</h4>
            <ul>
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <h4>Stay Updated</h4>
            <p>Get the latest news, updates, and insights from Mylesoft delivered to your inbox.</p>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="footer-bottom">
          <div className="footer-legal">
            <p>&copy; {new Date().getFullYear()} Mylesoft Technologies. All Rights Reserved.</p>
            <div className="legal-links">
              {legalLinks.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
