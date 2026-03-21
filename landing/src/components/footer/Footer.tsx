import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Modules", href: "#modules" },
    { label: "Pricing", href: "#pricing" },
    { label: "Book a Demo", href: "#demo" },
    { label: "Start Free Trial", href: "/auth/signup/api" },
  ],
  Company: [
    { label: "Contact", href: "/contact" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/terms#privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/terms#cookies" },
    { label: "Additional Policies", href: "/terms#other" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-navy text-white" role="contentinfo">
      {/* Gold top border */}
      <div className="h-1 w-full bg-gold-gradient" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 mb-4"
              aria-label="EduMyles home"
            >
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <span className="text-gold font-jakarta font-bold text-sm">E</span>
              </div>
              <span className="font-jakarta font-bold text-xl">
                Edu<span className="text-gold">Myles</span>
              </span>
            </Link>
            <p className="font-inter text-sm text-white/60 leading-relaxed mb-4">
              The all-in-one school management platform built for East Africa.
            </p>
            <div className="flex gap-3">
              <a
                href="https://twitter.com/edumyles"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold/20 flex items-center justify-center transition-colors"
                aria-label="EduMyles on Twitter"
              >
                <span className="text-sm font-bold">𝕏</span>
              </a>
              <a
                href="https://linkedin.com/company/edumyles"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold/20 flex items-center justify-center transition-colors text-xs font-bold"
                aria-label="EduMyles on LinkedIn"
              >
                in
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-jakarta font-semibold text-sm text-white/90 uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-inter text-sm text-white/60 hover:text-gold transition-colors"
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
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <p className="font-inter text-sm text-white/40">
            © {new Date().getFullYear()} Mylesoft Technologies Limited. All Rights Reserved.
          </p>
          <p className="font-inter text-xs text-white/30 text-center">
            Transforming Industries, Empowering Generations.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-inter text-xs text-white/40">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
