"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-md border-b border-light-grey"
          : "bg-transparent"
      }`}
    >
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="EduMyles — home">
            <div className="w-8 h-8 rounded-lg bg-navy-gradient flex items-center justify-center">
              <span className="text-gold font-jakarta font-bold text-sm">E</span>
            </div>
            <span className={`font-jakarta font-bold text-xl ${scrolled ? "text-navy" : "text-white"}`}>
              Edu<span className="text-gold">Myles</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`font-inter font-medium text-[15px] transition-colors hover:text-gold ${
                  scrolled ? "text-navy" : "text-white/90 hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="https://app.edumyles.com/auth/login"
              className={`font-inter font-medium text-[15px] px-4 py-2 transition-colors ${
                scrolled ? "text-navy hover:text-gold" : "text-white/90 hover:text-gold"
              }`}
            >
              Login
            </Link>
            <Link
              href="#demo"
              className="bg-gold hover:bg-gold-dark text-white font-inter font-semibold text-[15px] px-6 py-2.5 rounded-full transition-all duration-200 hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              Book a Free Demo
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-navy" : "text-white"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-navy z-40 flex flex-col p-6">
          <nav className="flex flex-col gap-2 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-white/90 hover:text-gold font-inter font-medium text-xl py-3 border-b border-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pb-safe">
            <Link
              href="https://app.edumyles.com/auth/login"
              onClick={() => setMobileOpen(false)}
              className="text-center text-white/90 border border-white/30 rounded-full py-3 font-inter font-medium transition-colors hover:border-gold hover:text-gold"
            >
              Login
            </Link>
            <Link
              href="#demo"
              onClick={() => setMobileOpen(false)}
              className="text-center bg-gold hover:bg-gold-dark text-white rounded-full py-3.5 font-inter font-semibold transition-colors"
            >
              Book a Free Demo
            </Link>
          </div>
        </div>
      )}

      {/* Mobile sticky bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-light-grey p-4 shadow-lg">
        <Link
          href="#demo"
          className="block text-center bg-gold hover:bg-gold-dark text-white rounded-full py-3.5 font-inter font-semibold transition-colors w-full"
        >
          Book a Free Demo
        </Link>
      </div>
    </header>
  );
}
