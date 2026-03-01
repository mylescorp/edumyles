"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://edumyles.vercel.app";

const navItems = [
  {
    label: "Features",
    href: "/features",
    dropdown: [
      { label: "Platform Overview", href: "/features#platform", desc: "Unified school management" },
      { label: "All 11 Modules", href: "/features#modules", desc: "Student, finance, operations & more" },
      { label: "Integrations", href: "/features#integrations", desc: "M-Pesa, Airtel Money, Stripe" },
      { label: "AI & Automation", href: "/features#ai", desc: "Smart scheduling & insights" },
    ],
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
  {
    label: "Solutions",
    href: "/solutions",
    dropdown: [
      { label: "For Primary Schools", href: "/solutions#primary", desc: "Simplified management for junior schools" },
      { label: "For Secondary Schools", href: "/solutions#secondary", desc: "Full academic & admin management" },
      { label: "For School Groups", href: "/solutions#groups", desc: "Multi-campus unified control" },
      { label: "For Partners", href: "/solutions#partners", desc: "White-label & API access" },
    ],
  },
  {
    label: "Success Stories",
    href: "/#stories",
  },
  {
    label: "Resources",
    href: "/resources",
    dropdown: [
      { label: "Blog", href: "/blog", desc: "Articles, guides & insights" },
      { label: "Product Videos", href: "/resources#videos", desc: "Walkthrough & tutorial videos" },
      { label: "Webinars", href: "/resources#webinars", desc: "Live & recorded sessions" },
      { label: "Guides", href: "/resources#guides", desc: "Implementation & best practices" },
    ],
  },
  {
    label: "About",
    href: "/about",
    dropdown: [
      { label: "Our Story", href: "/about", desc: "Mission, values & journey" },
      { label: "Team", href: "/team", desc: "Meet the people behind EduMyles" },
    ],
  },
  {
    label: "Concierge",
    href: "/concierge",
  },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <span>Introducing EduMyles — The Operating System for Schools in East Africa</span>
        <span className="badge">NEW</span>
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="navbar-logo">
          EduMyles
        </Link>

        <ul className="navbar-links">
          {navItems.map((item) => (
            <li
              key={item.label}
              className={`nav-item ${item.dropdown ? "has-dropdown" : ""}`}
              onMouseEnter={() => item.dropdown && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link href={item.href}>{item.label}</Link>
              {item.dropdown && (
                <div className={`nav-dropdown ${openDropdown === item.label ? "open" : ""}`}>
                  {item.dropdown.map((sub) => (
                    <Link key={sub.label} href={sub.href} className="dropdown-item">
                      <span className="dropdown-item-label">{sub.label}</span>
                      <span className="dropdown-item-desc">{sub.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <a className="navbar-login" href={`${APP_URL}/auth/login`}>
            Log In
          </a>
          <a className="navbar-signup" href={`${APP_URL}/auth/signup`}>
            Sign Up Free
          </a>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${mobileMenuOpen ? "open" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <div key={item.label} className="mobile-nav-group">
              <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </Link>
              {item.dropdown && (
                <div className="mobile-dropdown">
                  {item.dropdown.map((sub) => (
                    <Link key={sub.label} href={sub.href} onClick={() => setMobileMenuOpen(false)}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mobile-auth-actions">
            <a href={`${APP_URL}/auth/login`} className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
              Log In
            </a>
            <a href={`${APP_URL}/auth/signup`} className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
              Sign Up Free
            </a>
          </div>
        </div>
      )}
    </>
  );
}
