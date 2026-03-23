import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Demo", href: "#demo" },
  ],
  Solutions: [
    { label: "Primary Schools", href: "#" },
    { label: "Secondary Schools", href: "#" },
    { label: "International", href: "#" },
    { label: "School Groups", href: "#" },
    { label: "For Parents", href: "#" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Team", href: "/team" },
    { label: "Blog", href: "/blog" },
    { label: "Case Studies", href: "#" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/terms#privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

const socialLinks = [
  { label: "LinkedIn", icon: "in", href: "https://linkedin.com/company/edumyles" },
  { label: "Twitter / X", icon: "𝕏", href: "https://twitter.com/edumyles" },
  { label: "Facebook", icon: "f", href: "#" },
  { label: "YouTube", icon: "▶", href: "#" },
];

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="text-white px-4 sm:px-8 pt-12 pb-4"
      style={{ background: "#061A12" }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 mb-4 no-underline"
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
                <strong className="text-[16px] font-bold text-white">EduMyles</strong>
                <small className="text-[10px] font-medium" style={{ color: "#6B9E83" }}>
                  School Management, Simplified
                </small>
              </div>
            </Link>

            <p className="text-[14px] mb-4" style={{ color: "#6B9E83" }}>
              Transforming school management across Africa
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`EduMyles on ${s.label}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[14px] font-bold no-underline transition-colors duration-300 hover:bg-leaf"
                  style={{ background: "#1A7A4A" }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="font-playfair text-[18px] font-bold mb-4"
                style={{ color: "#E8A020" }}
              >
                {category}
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-white no-underline transition-colors duration-300 hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[13px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "#6B9E83" }}
        >
          <div>
            © 2026 EduMyles — A{" "}
            <a
              href="https://mylesoft.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#E8A020", textDecoration: "none" }}
            >
              MylesCorp Technologies Ltd
            </a>{" "}
            Product · All Rights Reserved
          </div>
          <div>📞 0743 993 715 · 📧 mylesoftafrica@gmail.com</div>
        </div>
      </div>
    </footer>
  );
}
