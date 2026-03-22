"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    const path = window.location.pathname.split("/").pop() || "index";
    setActiveLink(path);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        role="banner"
        className="sticky top-0 bg-white border-b border-gray-200 z-[1000] px-4 sm:px-8"
        style={{ borderBottom: "1px solid #e0e0e0" }}
      >
        <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-8 h-[70px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-[#061A12] no-underline flex-shrink-0" aria-label="EduMyles — home">
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
              <small className="text-[10px] font-medium text-[#6B9E83]">School Management, Simplified</small>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[14px] font-medium text-[#061A12] no-underline transition-colors duration-300 hover:text-[#E8A020]"
                style={activeLink === link.href.replace("/", "") ? { color: "#E8A020" } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/auth/login/api"
              className="text-[14px] font-semibold no-underline px-5 py-2.5 rounded-[50px] transition-all duration-200"
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
              href="/auth/signup/api"
              className="text-[14px] font-bold no-underline whitespace-nowrap px-6 py-3 rounded-[50px] transition-colors duration-200 hover:bg-[#0F4C2A]"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Get Started
            </a>
            <Link
              href="#demo"
              className="text-[14px] font-bold text-[#061A12] no-underline whitespace-nowrap transition-colors duration-300 hover:bg-[#F5C453] px-6 py-3 rounded-[50px]"
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
                transform: mobileOpen ? "rotate(45deg) translate(8px, 8px)" : "none",
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
                transform: mobileOpen ? "rotate(-45deg) translate(7px, -7px)" : "none",
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
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-[#061A12] no-underline font-medium text-lg transition-colors border-b border-gray-100 hover:text-[#E8A020]"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-6">
            <a
              href="/auth/signup/api"
              onClick={() => setMobileOpen(false)}
              className="block text-center font-bold no-underline py-3 px-6 rounded-[50px]"
              style={{ background: "#061A12", color: "#ffffff" }}
            >
              Get Started
            </a>
            <a
              href="/auth/login/api"
              onClick={() => setMobileOpen(false)}
              className="block text-center font-semibold no-underline py-3 px-6 rounded-[50px] transition-colors"
              style={{ border: "1.5px solid #061A12", color: "#061A12" }}
            >
              Log In
            </a>
            <Link
              href="#demo"
              onClick={() => setMobileOpen(false)}
              className="block text-center font-bold text-[#061A12] no-underline py-3 px-6 rounded-[50px]"
              style={{ background: "#E8A020" }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
