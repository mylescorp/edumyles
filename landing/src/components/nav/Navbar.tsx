"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Point auth actions at the frontend app (different domain in production)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
const LOGIN_URL = `${APP_URL}/auth/login/api`;
const SIGNUP_URL = `${APP_URL}/auth/signup/api`;

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/contact" },
];

const solutionItems = [
  {
    icon: "🏫",
    label: "Primary Schools",
    href: "/solutions/primary-schools",
    subtitle: "CBC-ready, M-Pesa fees",
  },
  {
    icon: "🎓",
    label: "Secondary Schools",
    href: "/solutions/secondary-schools",
    subtitle: "KCSE, timetabling, HR & payroll",
  },
  {
    icon: "🌍",
    label: "International Schools",
    href: "/solutions/international-schools",
    subtitle: "IGCSE, IB, SSO, white-label",
  },
  {
    icon: "🏢",
    label: "School Groups",
    href: "/solutions/school-groups",
    subtitle: "Multi-campus, network reporting",
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = window.location.pathname.split("/").pop() || "index";
    setActiveLink(path);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        solutionsRef.current &&
        !solutionsRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav
        role="banner"
        className="sticky top-0 bg-white border-b border-gray-200 z-[1000] px-4 sm:px-8"
        style={{ borderBottom: "1px solid #e0e0e0" }}
      >
        <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-8 h-[70px]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 text-[#061A12] no-underline flex-shrink-0"
            aria-label="EduMyles — home"
          >
            <div
              className="w-10 h-10 flex items-center justify-center rounded-[14px] font-playfair font-bold text-2xl flex-shrink-0"
              style={{
                background: "#0F4C2A",
                border: "2px solid #E8A020",
                color: "#E8A020",
              }}
            >
              E
            </div>
            <div className="flex flex-col gap-0 leading-none">
              <strong className="text-[16px] font-bold text-[#061A12]">EduMyles</strong>
              <small className="text-[10px] font-medium text-[#6B9E83]">
                "School Management, Simplified"
              </small>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {/* Features */}
            <Link
              href="/features"
              className="text-[14px] font-medium text-[#061A12] no-underline transition-colors duration-300 hover:text-[#E8A020]"
              style={activeLink === "features" ? { color: "#E8A020" } : {}}
            >
              Features
            </Link>

            {/* Solutions dropdown */}
            <div className="relative" ref={solutionsRef}>
              <button
                type="button"
                onClick={() => setSolutionsOpen((prev) => !prev)}
                className="flex items-center gap-1 text-[14px] font-medium text-[#061A12] no-underline transition-colors duration-300 hover:text-[#E8A020] bg-transparent border-none cursor-pointer p-0"
                style={
                  solutionsOpen ||
                  activeLink.startsWith("solutions")
                    ? { color: "#E8A020" }
                    : {}
                }
                aria-haspopup="true"
                aria-expanded={solutionsOpen}
              >
                Solutions
                <span
                  className="text-[10px] transition-transform duration-200 inline-block"
                  style={{
                    transform: solutionsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▾
                </span>
              </button>

              {solutionsOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-xl border border-gray-100 shadow-lg z-50 p-3 grid grid-cols-2 gap-2"
                  style={{ minWidth: "340px" }}
                >
                  {solutionItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSolutionsOpen(false)}
                      className="flex items-start gap-2 p-2 rounded-lg no-underline transition-colors duration-150 hover:bg-[#F3FBF6]"
                    >
                      <span className="text-xl leading-none mt-0.5">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[13px] text-[#061A12] leading-tight">
                          {item.label}
                        </span>
                        <span className="text-xs text-gray-500 leading-snug mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Remaining nav links */}
            {navLinks
              .filter((link) => link.label !== "Features")
              .map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[14px] font-medium text-[#061A12] no-underline transition-colors duration-300 hover:text-[#E8A020]"
                  style={
                    activeLink === link.href.replace("/", "")
                      ? { color: "#E8A020" }
                      : {}
                  }
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={LOGIN_URL}
              className="text-[14px] font-semibold no-underline px-5 py-2.5 rounded-[8px] transition-all duration-200"
              style={{
                color: "#061A12",
                border: "1.5px solid #061A12",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#061A12";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#061A12";
              }}
            >
              Log In
            </a>
            <a
              href={SIGNUP_URL}
              className="text-[14px] font-bold no-underline whitespace-nowrap px-6 py-3 rounded-[8px] transition-colors duration-200 hover:bg-[#0F4C2A]"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Get Started
            </a>
            <Link
              href="#demo"
              className="text-[14px] font-bold text-[#061A12] no-underline whitespace-nowrap transition-colors duration-300 hover:bg-[#F5C453] px-6 py-3 rounded-[8px]"
              style={{ background: "#E8A020" }}
            >
              Book a Demo
            </Link>
          </div>

          {/* Hamburger */}
          <button
            type="button"
            className="lg:hidden flex flex-col gap-[5px] cursor-pointer p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <span
              className="w-6 h-[3px] rounded-sm transition-all duration-300"
              style={{
                background: "#061A12",
                transform: mobileOpen
                  ? "rotate(45deg) translate(8px, 8px)"
                  : "none",
              }}
            />
            <span
              className="w-6 h-[3px] rounded-sm transition-all duration-300"
              style={{
                background: "#061A12",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="w-6 h-[3px] rounded-sm transition-all duration-300"
              style={{
                background: "#061A12",
                transform: mobileOpen
                  ? "rotate(-45deg) translate(7px, -7px)"
                  : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[999] flex flex-col p-8 overflow-y-auto"
          style={{ top: "70px", background: "#ffffff" }}
        >
          {/* Features */}
          <Link
            href="/features"
            onClick={() => setMobileOpen(false)}
            className="block py-3 text-[#061A12] no-underline font-medium text-lg transition-colors border-b border-gray-100 hover:text-[#E8A020]"
          >
            Features
          </Link>

          {/* Solutions section — expanded list (no dropdown) */}
          <div className="border-b border-gray-100">
            <span className="block py-3 text-[#061A12] font-medium text-lg">
              Solutions
            </span>
            <div className="flex flex-col pb-2">
              {solutionItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 pl-5 py-2 text-[#061A12] no-underline text-base transition-colors hover:text-[#E8A020]"
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-gray-400 ml-1">— {item.subtitle}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Remaining nav links (skip Features, already rendered above) */}
          {navLinks
            .filter((link) => link.label !== "Features")
            .map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-[#061A12] no-underline font-medium text-lg transition-colors border-b border-gray-100 hover:text-[#E8A020]"
              >
                {link.label}
              </Link>
            ))}

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            <a
              href={SIGNUP_URL}
              onClick={() => setMobileOpen(false)}
              className="block text-center font-bold no-underline py-3 px-6 rounded-[8px]"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Get Started
            </a>
            <a
              href={LOGIN_URL}
              onClick={() => setMobileOpen(false)}
              className="block text-center font-semibold no-underline py-3 px-6 rounded-[8px] transition-colors"
              style={{ border: "1.5px solid #061A12", color: "#061A12" }}
            >
              Log In
            </a>
            <Link
              href="#demo"
              onClick={() => setMobileOpen(false)}
              className="block text-center font-bold text-[#061A12] no-underline py-3 px-6 rounded-[8px]"
              style={{ background: "#E8A020" }}
            >
              Book a Demo
            </Link>
          </div>

          {/* Footer-style quick links */}
          <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
            <Link
              href="/case-studies"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-500 no-underline hover:text-[#061A12] transition-colors"
            >
              Case Studies
            </Link>
            <Link
              href="/partners"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-500 no-underline hover:text-[#061A12] transition-colors"
            >
              Partner Programme
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
