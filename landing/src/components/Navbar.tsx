"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";


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

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

function getUserFromCookie(): UserInfo | null {
  // ALWAYS return null on landing page - this is a marketing page, not an authenticated app
  return null;
}


export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  // ALWAYS null user on landing page - never show logged-in state
  const user = null;

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

  const initials = ""; // No user on landing page, so no initials
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const handleLogout = () => {
    // Use server-side logout to properly clear httpOnly cookies
    window.location.href = `${appUrl}/auth/logout`;
  };

  const handleMobileLogout = () => {
    setMobileMenuOpen(false);
    window.location.href = `${appUrl}/auth/logout`;
  };

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
          {false ? ( // ALWAYS false on landing page - never show logged-in state
            <>
              <div className="navbar-user">
                <div className="navbar-avatar">{initials}</div>
                <span className="navbar-username">User</span>
              </div>
              <button
                type="button"
                className="navbar-login"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link className="navbar-login" href={`${appUrl}/auth/login/api`}>
                Log In
              </Link>
              <Link className="navbar-get-started" href={`${appUrl}/auth/login/api`}>
                Get Started
              </Link>
              <Link className="navbar-signup" href={`${appUrl}/auth/login/api`}>
                Sign Up Free
              </Link>
            </>
          )}

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
            {false ? ( // ALWAYS false on landing page - never show logged-in state
              <>
                <div className="mobile-user-info">
                  <div className="navbar-avatar">{initials}</div>
                  <span>User</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleMobileLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href={`${appUrl}/auth/login/api`} className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Link>
                <Link href={`${appUrl}/auth/login/api`} className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
                <Link href={`${appUrl}/auth/login/api`} className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up Free
                </Link>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
