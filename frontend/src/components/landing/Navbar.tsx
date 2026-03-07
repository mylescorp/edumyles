"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Features",
    href: "/#modules",
    dropdown: [
      { label: "Platform Overview", href: "/#modules", desc: "Unified school management" },
      { label: "All 11 Modules", href: "/#modules", desc: "Student, finance, operations & more" },
      { label: "Integrations", href: "/#modules", desc: "M-Pesa, Airtel Money, Stripe" },
      { label: "AI & Automation", href: "/#modules", desc: "Smart scheduling & insights" },
    ],
  },
  {
    label: "Pricing",
    href: "/#pricing",
  },
  {
    label: "Solutions",
    href: "/#modules",
    dropdown: [
      { label: "For Primary Schools", href: "/#modules", desc: "Simplified management for junior schools" },
      { label: "For Secondary Schools", href: "/#modules", desc: "Full academic & admin management" },
      { label: "For School Groups", href: "/#modules", desc: "Multi-campus unified control" },
      { label: "For Partners", href: "/#modules", desc: "White-label & API access" },
    ],
  },
  {
    label: "Success Stories",
    href: "/#stories",
  },
  {
    label: "Resources",
    href: "/#stories",
    dropdown: [
      { label: "Blog", href: "/#stories", desc: "Articles, guides & insights" },
      { label: "Product Videos", href: "/#stories", desc: "Walkthrough & tutorial videos" },
      { label: "Webinars", href: "/#stories", desc: "Live & recorded sessions" },
      { label: "Guides", href: "/#stories", desc: "Implementation & best practices" },
    ],
  },
  {
    label: "About",
    href: "/#brand",
    dropdown: [
      { label: "Our Story", href: "/#brand", desc: "Mission, values & journey" },
      { label: "Team", href: "/#brand", desc: "Meet the people behind EduMyles" },
    ],
  },
  {
    label: "Concierge",
    href: "/#concierge",
  },
];

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

function getUserFromCookie(): UserInfo | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("edumyles_user="));
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const initials = user
    ? (`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      (user.email?.[0] ?? "").toUpperCase())
    : "";

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const handleMobileLogout = () => {
    setMobileMenuOpen(false);
    window.location.href = "/auth/logout";
  };

  return (
    <>
      <div className="announcement-bar">
        <span>Introducing EduMyles - The Operating System for Schools in East Africa</span>
        <span className="badge">NEW</span>
      </div>

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
          {user ? (
            <>
              <div className="navbar-user">
                <div className="navbar-avatar">{initials}</div>
                <span className="navbar-username">{user.firstName || user.email.split("@")[0]}</span>
              </div>
              <button type="button" className="navbar-login" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link className="navbar-login" href="/auth/login">
                Log In
              </Link>
              <Link className="navbar-get-started" href="/auth/login">
                Get Started
              </Link>
              <Link className="navbar-signup" href="/auth/login">
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
            {user ? (
              <>
                <div className="mobile-user-info">
                  <div className="navbar-avatar">{initials}</div>
                  <span>{user.firstName || user.email.split("@")[0]}</span>
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleMobileLogout}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Link>
                <Link href="/auth/login" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
                <Link href="/auth/login" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
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
