import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * EduMyles Design System v3.0 — Tailwind CSS Configuration
 * All colours map to CSS tokens defined in globals.css (:root / .dark)
 * Do NOT hardcode hex values in components — use token-based classes.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      /* ── Fonts ────────────────────────────────────────────────────── */
      fontFamily: {
        sans:    ["var(--font-plus-jakarta)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif:   ["var(--font-playfair)", "Georgia", '"Times New Roman"', "serif"],
        mono:    ["var(--font-dm-mono)", '"JetBrains Mono"', '"Fira Code"', "monospace"],
        inter:   ["var(--font-inter)", "system-ui", "sans-serif"],
        // legacy alias kept for existing components
        poppins: ["var(--font-playfair)", "var(--font-plus-jakarta)", "sans-serif"],
      },

      /* ── Colours ──────────────────────────────────────────────────── */
      colors: {
        /* ── Shadcn/ui semantic tokens — point to v3 CSS vars ─────── */
        border:     "var(--em-border)",
        input:      "var(--em-border)",
        ring:       "var(--em-gold, #E8A020)",
        background: "var(--em-bg-base)",
        foreground: "var(--em-text-primary)",

        muted: {
          DEFAULT:    "var(--em-bg-muted)",
          foreground: "var(--em-text-secondary)",
        },
        /* shadcn accent = subtle hover surface (ghost buttons, etc.) */
        accent: {
          DEFAULT:    "var(--em-bg-muted)",
          foreground: "var(--em-text-primary)",
        },
        secondary: {
          DEFAULT:    "var(--em-bg-muted)",
          foreground: "var(--em-text-primary)",
        },
        destructive: {
          DEFAULT:    "var(--em-danger)",
          foreground: "var(--em-text-inverse)",
        },
        card: {
          DEFAULT:    "var(--em-bg-base)",
          foreground: "var(--em-text-primary)",
        },
        popover: {
          DEFAULT:    "var(--em-bg-base)",
          foreground: "var(--em-text-primary)",
        },
        sidebar: {
          DEFAULT:              "var(--sidebar-bg)",
          foreground:           "var(--sidebar-text-active)",
          primary:              "var(--sidebar-text-active)",
          "primary-foreground": "var(--sidebar-bg)",
          accent:               "var(--sidebar-active)",
          "accent-foreground":  "var(--sidebar-text-active)",
          border:               "var(--sidebar-border)",
          ring:                 "var(--sidebar-active)",
        },

        /* ── EduMyles 2026 Brand Primary — Forest Green Family ─────── */
        primary: {
          DEFAULT:    "#0F4C2A",               // Forest      — brand primary
          foreground: "#FFFFFF",               // white text on primary bg
          light:      "#26A65B",               // Leaf Green  — success, CTAs
          dark:       "#061A12",               // Forest Deep — sidebar dark, footer
          "10":       "rgba(15,76,42,0.10)",   // overlay tint for hover states
          emerald:    "#1A7A4A",               // Emerald     — hover / interactive
          mint:       "#A8E6C3",               // Mint        — light text on dark
        },

        /* ── EduMyles Accent — Gold Family ─────────────────────────── */
        "em-accent": {
          DEFAULT:  "#E8A020",   // Gold — primary CTA, active nav, accents
          light:    "#F5C453",   // Gold Light — hover / gradient end
          dark:     "#9A5D00",   // Gold Deep — on light backgrounds
          pale:     "#FEF3DC",   // Gold Pale — alert callout backgrounds
        },

        /* ── Sunshine Yellow — Achievement / Celebration ONLY ───────── */
        "em-yellow": {
          DEFAULT:  "#F5D800",   // Sunshine Yellow — badges, awards, top student
          light:    "#FFF176",   // Yellow Light — pale celebration tint
        },

        /* ── Ocean Blue Family ──────────────────────────────────────── */
        "em-ocean": {
          deep:    "#001535",    // Ocean Deep — blue card surfaces
          DEFAULT: "#1565C0",    // Ocean — links, informational
          sky:     "#90CAF9",    // Sky — body text on dark backgrounds
          pale:    "#E3F2FD",    // Sky Pale — info callout backgrounds
        },

        /* ── Semantic ─────────────────────────────────────────────── */
        info: {
          DEFAULT: "#1565C0",    // Ocean Blue
          bg:      "#E3F2FD",
        },
        success: {
          DEFAULT: "#26A65B",    // Leaf Green
          bg:      "#E8F5EE",
        },
        warning: {
          DEFAULT: "#E8A020",    // Gold
          bg:      "#FEF3DC",
        },
        danger: {
          DEFAULT: "#DC2626",
          bg:      "#FEE2E2",
        },

        /* ── Neutral Scale ────────────────────────────────────────── */
        neutral: {
          50:  "#F3FBF6",  // off-white page background
          100: "#E8F5EE",  // ice surface / zebra rows
          200: "#A8E6C3",  // mint borders / dividers
          400: "#6B9E83",  // sage muted / helper text
          500: "#3D6E54",  // medium green text
          700: "#0F4C2A",  // forest for dark contexts
          900: "#061A12",  // forest deep
        },

        /* ── Role-based identity colours ─────────────────────────── */
        role: {
          "super-admin": "#061A12",
          "school-admin":"#0F4C2A",
          teacher:       "#1A7A4A",
          finance:       "#E8A020",
          parent:        "#1565C0",
          student:       "#7C3AED",
        },

        /* ── Data Visualisation chart palette ─────────────────────── */
        chart: {
          "1": "#E8A020",  // primary — gold (fees, enrolment totals)
          "2": "#26A65B",  // present / paid / pass
          "3": "#90CAF9",  // informational / comparison series
          "4": "#F5D800",  // achievement highlight (use sparingly)
          "5": "#6B9E83",  // baseline / low-emphasis
          "6": "#DC2626",  // absent / overdue / failed — use last
        },

        /* ── Marketing accent (landing pages ONLY, not product UI) ── */
        marketing: {
          amber: "#E8A020",
        },
      },

      /* ── Shadows ──────────────────────────────────────────────────── */
      boxShadow: {
        "em-sm": "0 1px 3px rgba(0,0,0,0.08)",    // cards, inputs, nav items
        "em-md": "0 4px 12px rgba(0,0,0,0.10)",   // hover states, dropdowns
        "em-lg": "0 8px 24px rgba(0,0,0,0.12)",   // modals, drawers
        "em-xl": "0 16px 40px rgba(0,0,0,0.15)",  // full-screen modals
      },

      /* ── Border Radius ────────────────────────────────────────────── */
      borderRadius: {
        card: "18px",  // standard card border-radius per design system
      },

      /* ── Font Sizes ───────────────────────────────────────────────── */
      fontSize: {
        hero:      ["60px", { lineHeight: "1.1",  fontWeight: "700" }],
        section:   ["40px", { lineHeight: "1.15", fontWeight: "700" }],
        "body-lg": ["17px", { lineHeight: "1.5",  fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5",  fontWeight: "500" }],
      },

      /* ── Max Width ────────────────────────────────────────────────── */
      maxWidth: {
        page: "1200px",
      },

      /* ── Animations ───────────────────────────────────────────────── */
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer:    "shimmer 1.5s infinite",           // skeleton loaders
        "fade-in":  "fade-in 0.2s ease-out",           // dropdowns, modals
        "slide-in": "slide-in-right 0.3s ease-out",    // toast notifications
      },
    },
  },
  plugins: [animate],
};

export default config;
