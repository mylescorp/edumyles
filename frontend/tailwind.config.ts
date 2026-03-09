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
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],   // product UI
        poppins: ["var(--font-poppins)", '"Poppins"', "sans-serif"], // marketing / headings
        mono:    ['"JetBrains Mono"', "monospace"],                  // code blocks
      },

      /* ── Colours ──────────────────────────────────────────────────── */
      colors: {
        /* ── Shadcn/ui semantic tokens — point to v3 CSS vars ─────── */
        border:     "var(--em-border)",
        input:      "var(--em-border)",
        ring:       "var(--em-primary-light)",
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

        /* ── EduMyles Brand Primary ───────────────────────────────── */
        /* Merged with shadcn `primary` — foreground required by shadcn */
        primary: {
          DEFAULT:    "#1A4731",               // Dark Green  — navbar, sidebar, headers
          foreground: "#FFFFFF",               // white text on primary bg (shadcn compat)
          light:      "#16A34A",               // Emerald     — ALL primary CTAs, success
          dark:       "#0F2E20",               // Deep Green  — sidebar dark, footer
          "10":       "rgba(26,71,49,0.10)",   // overlay tint for hover states
        },

        /* ── EduMyles Accent — Amber/Gold ─────────────────────────── */
        /* Separate key from shadcn `accent` to avoid conflicts */
        "em-accent": {
          DEFAULT: "#F59E0B",  // Warnings, fee due, announcements, pending badges
          light:   "#FDE68A",
          dark:    "#B45309",
        },

        /* ── Semantic ─────────────────────────────────────────────── */
        info: {
          DEFAULT: "#1E3A8A",
          bg:      "#DBEAFE",
        },
        success: {
          DEFAULT: "#16A34A",
          bg:      "#DCFCE7",
        },
        warning: {
          DEFAULT: "#F59E0B",
          bg:      "#FEF9C3",
        },
        danger: {
          DEFAULT: "#DC2626",
          bg:      "#FEE2E2",
        },

        /* ── Neutral Scale ────────────────────────────────────────── */
        neutral: {
          50:  "#F8FAFC",  // page background, outer wrapper
          100: "#F1F5F9",  // input backgrounds, zebra rows, muted surfaces
          200: "#E2E8F0",  // borders, dividers, skeleton base
          400: "#94A3B8",  // disabled text, placeholders
          500: "#64748B",  // secondary / helper text
          700: "#334155",  // dark borders in dark mode
          900: "#0F172A",  // code block backgrounds, tooltips
        },

        /* ── Role-based identity colours ─────────────────────────── */
        role: {
          "super-admin": "#1A4731",
          "school-admin":"#1E3A8A",
          teacher:       "#16A34A",
          finance:       "#F59E0B",
          parent:        "#0D9488",
          student:       "#7C3AED",
        },

        /* ── Data Visualisation chart palette ─────────────────────── */
        chart: {
          "1": "#16A34A",  // present / paid / pass
          "2": "#1E3A8A",  // second series / enrolment
          "3": "#F59E0B",  // pending / partial / in-progress
          "4": "#7C3AED",  // student metrics
          "5": "#0D9488",  // parent engagement
          "6": "#DC2626",  // absent / overdue / failed — use last
        },

        /* ── Marketing accent (landing pages ONLY, not product UI) ── */
        marketing: {
          amber: "#FFD731",
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
