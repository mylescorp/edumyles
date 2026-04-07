"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { School, GraduationCap, Globe, Building2, Briefcase, Code, Users, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SIGNUP_URL = "/waitlist";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "About", href: "/about" },
  { label: "Team", href: "/team" },
  { label: "Careers", href: "/careers" },
  { label: "Pricing",  href: "/pricing" },
  { label: "Blog",     href: "/blog" },
  { label: "Contact",  href: "/contact" },
];

type SolutionItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  subtitle: string;
};

const solutionItems: SolutionItem[] = [
  {
    icon: School,
    label: "Primary Schools",
    href: "/solutions/primary-schools",
    subtitle: "CBC-ready with M-Pesa integration & automated fee management",
  },
  {
    icon: GraduationCap,
    label: "Secondary Schools",
    href: "/solutions/secondary-schools",
    subtitle: "KCSE management, advanced timetabling & HR payroll systems",
  },
  {
    icon: Globe,
    label: "International Schools",
    href: "/solutions/international-schools",
    subtitle: "IGCSE & IB curriculum support with SSO and white-label options",
  },
  {
    icon: Building2,
    label: "School Groups",
    href: "/solutions/school-groups",
    subtitle: "Multi-campus management with consolidated reporting & analytics",
  },
  {
    icon: Briefcase,
    label: "All Solutions",
    href: "/solutions",
    subtitle: "Explore our complete school management ecosystem",
  },
];

type PartnerItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  subtitle: string;
};

const partnerItems: PartnerItem[] = [
  {
    icon: Code,
    label: "Developers",
    href: "/apply/developer",
    subtitle: "Build and sell educational modules on our marketplace",
  },
  {
    icon: Users,
    label: "Affiliates",
    href: "/apply/affiliate",
    subtitle: "Earn commissions by referring schools to EduMyles",
  },
  {
    icon: Award,
    label: "Resellers",
    href: "/apply/reseller",
    subtitle: "Sell EduMyles solutions and earn recurring revenue",
  },
];


export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);
  const activeLink = pathname.split("/").pop() || "index";

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        solutionsRef.current &&
        !solutionsRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
      if (
        partnersRef.current &&
        !partnersRef.current.contains(event.target as Node)
      ) {
        setPartnersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          <Logo size="md" />

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
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-xl border border-gray-100 shadow-lg z-50 p-4 grid grid-cols-1 gap-2"
                  style={{ minWidth: "380px" }}
                >
                  <div className="col-span-1 grid grid-cols-1 gap-2">
                    {solutionItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSolutionsOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-[10px] no-underline transition-all duration-150 hover:bg-[#F3FBF6] group"
                      >
                        <div
                          className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors duration-150"
                          style={{ background: "rgba(26,122,74,0.08)" }}
                        >
                          <item.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-jakarta font-semibold text-[14px] text-[#061A12] leading-tight group-hover:text-[#1A7A4A] transition-colors duration-150">
                            {item.label}
                          </span>
                          <span className="font-jakarta text-[12px] leading-snug mt-1" style={{ color: "#6B9E83" }}>
                            {item.subtitle}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* All other nav links */}
            {navLinks
              .filter((link) => link.label !== "Features" && link.label !== "Solutions")
              .map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[14px] font-medium text-[#061A12] no-underline transition-colors duration-300 hover:text-[#E8A020]"
                  style={
                    activeLink === link.href.replace("/", "") ||
                    (link.label === "Resellers" && activeLink === "partners")
                      ? { color: "#E8A020" }
                      : {}
                  }
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
            <a
              href="/book-demo"
              className="font-jakarta font-bold text-[14px] no-underline whitespace-nowrap px-5 py-[10px] rounded-[8px] transition-all duration-200 inline-flex items-center"
              style={{
                background: "#E8A020",
                color: "#061A12",
                border: "1.5px solid #E8A020",
                lineHeight: "1",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F5C453";
                e.currentTarget.style.borderColor = "#F5C453";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E8A020";
                e.currentTarget.style.borderColor = "#E8A020";
              }}
            >
              Book a Demo
            </a>
            <a
              href={SIGNUP_URL}
              className="font-jakarta font-semibold text-[14px] no-underline whitespace-nowrap px-5 py-[10px] rounded-[8px] transition-all duration-200 inline-flex items-center"
              style={{
                background: "#0F4C2A",
                color: "#ffffff",
                border: "1.5px solid #0F4C2A",
                lineHeight: "1",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#061A12";
                e.currentTarget.style.borderColor = "#061A12";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0F4C2A";
                e.currentTarget.style.borderColor = "#0F4C2A";
              }}
            >
              Get Started
            </a>
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
                  <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-gray-400 ml-1">— {item.subtitle}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Remaining nav links (Pricing, Blog, Contact — skip Features) */}
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
              href="/book-demo"
              onClick={() => setMobileOpen(false)}
              className="font-jakarta font-bold text-[15px] no-underline text-center py-3.5 px-6 rounded-[8px] transition-all duration-200"
              style={{ background: "#E8A020", color: "#061A12", border: "1.5px solid #E8A020" }}
            >
              Book a Demo
            </a>
            <a
              href={SIGNUP_URL}
              onClick={() => setMobileOpen(false)}
              className="font-jakarta font-semibold text-[15px] no-underline text-center py-3.5 px-6 rounded-[8px] transition-all duration-200"
              style={{ background: "#0F4C2A", color: "#ffffff", border: "1.5px solid #0F4C2A" }}
            >
              Get Started
            </a>
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
              href="/resellers"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-500 no-underline hover:text-[#061A12] transition-colors"
            >
              Reseller Programme
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
