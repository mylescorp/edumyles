"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/landing/ThemeToggle";

interface DropdownItem {
  label: string;
  desc: string;
  href: string;
}

interface NavGroup {
  label: string;
  href: string;
  items?: DropdownItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Product",
    href: "/features",
    items: [
      { label: "Features", desc: "11 modules for every school operation", href: "/features" },
      { label: "Solutions", desc: "Tailored for primary, secondary & multi-campus", href: "/solutions" },
      { label: "Pricing", desc: "Transparent plans that scale with you", href: "/pricing" },
    ],
  },
  {
    label: "Company",
    href: "/about",
    items: [
      { label: "About", desc: "Our mission to transform African education", href: "/about" },
      { label: "Team", desc: "Engineers, educators & operators", href: "/team" },
      { label: "Blog", desc: "Insights on school operations & ed-tech", href: "/blog" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    items: [
      { label: "Guides & Demos", desc: "Implementation playbooks & walkthroughs", href: "/resources" },
      { label: "Concierge", desc: "Free consultation with a school-tech expert", href: "/concierge" },
      { label: "Contact", desc: "Sales, support & partnership enquiries", href: "/contact" },
    ],
  },
];

export default function LandingNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleDropdownEnter(label: string) {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setOpenDropdown(label);
  }

  function handleDropdownLeave() {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  }

  return (
    <nav ref={navRef} className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <Link href="/" className="navbar-logo" aria-label="EduMyles — home">
        Edu<span style={{ opacity: 0.65 }}>Myles</span>
      </Link>

      {/* Desktop Nav */}
      <div className="navbar-links">
        {NAV_GROUPS.map((group) => (
          <div
            key={group.label}
            className={`nav-item ${group.items ? "has-dropdown" : ""}`}
            onMouseEnter={() => group.items && handleDropdownEnter(group.label)}
            onMouseLeave={() => group.items && handleDropdownLeave()}
          >
            <Link href={group.href}>{group.label}</Link>
            {group.items && (
              <div className={`nav-dropdown ${openDropdown === group.label ? "open" : ""}`}>
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} className="dropdown-item">
                    <span className="dropdown-item-label">{item.label}</span>
                    <span className="dropdown-item-desc">{item.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Actions */}
      <div className="navbar-actions">
        <ThemeToggle />
        <a href="/auth/login/api" className="navbar-login">
          Sign In
        </a>
        <a href="/auth/signup/api" className="navbar-get-started">
          Get Started
        </a>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <span className={`hamburger ${mobileOpen ? "open" : ""}`} />
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu" style={{ display: "flex" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mobile-nav-group">
              <Link href={group.href}>{group.label}</Link>
              {group.items && (
                <div className="mobile-dropdown">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mobile-auth-actions">
            <a href="/auth/login/api" className="btn btn-outline">
              Sign In
            </a>
            <a href="/auth/signup/api" className="btn btn-primary">
              Get Started Free
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
