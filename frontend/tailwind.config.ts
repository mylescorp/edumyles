import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const tokenColor = (token: string) =>
  `color-mix(in srgb, var(${token}) calc(<alpha-value> * 100%), transparent)`;

const statusScale = (name: "success" | "warning" | "danger" | "info") => ({
  50: tokenColor(`--color-status-${name}-subtle`),
  100: tokenColor(`--color-status-${name}-subtle`),
  200: tokenColor(`--color-status-${name}-subtle`),
  300: tokenColor(`--color-status-${name}-solid`),
  400: tokenColor(`--color-status-${name}-solid`),
  500: tokenColor(`--color-status-${name}-solid`),
  600: tokenColor(`--color-status-${name}-on-subtle`),
  700: tokenColor(`--color-status-${name}-on-subtle`),
  800: tokenColor(`--color-status-${name}-on-subtle`),
  900: tokenColor(`--color-status-${name}-on-subtle`),
  950: tokenColor(`--color-status-${name}-on-subtle`),
});

const brandScale = (name: "primary" | "info") => ({
  50: tokenColor(name === "primary" ? "--color-action-primary-subtle" : "--color-status-info-subtle"),
  100: tokenColor(name === "primary" ? "--color-action-primary-subtle" : "--color-status-info-subtle"),
  200: tokenColor(name === "primary" ? "--color-action-primary-subtle" : "--color-status-info-subtle"),
  300: tokenColor(name === "primary" ? "--color-action-primary" : "--color-status-info-solid"),
  400: tokenColor(name === "primary" ? "--color-action-primary" : "--color-status-info-solid"),
  500: tokenColor(name === "primary" ? "--color-action-primary" : "--color-status-info-solid"),
  600: tokenColor(name === "primary" ? "--color-action-primary-text" : "--color-status-info-on-subtle"),
  700: tokenColor(name === "primary" ? "--color-action-primary-text" : "--color-status-info-on-subtle"),
  800: tokenColor(name === "primary" ? "--color-action-primary-text" : "--color-status-info-on-subtle"),
  900: tokenColor(name === "primary" ? "--color-action-primary-text" : "--color-status-info-on-subtle"),
  950: tokenColor("--color-chrome-platform"),
});

const neutralScale = {
  50: tokenColor("--color-surface-page"),
  100: tokenColor("--color-surface-sunken"),
  200: tokenColor("--color-border-default"),
  300: tokenColor("--color-border-default"),
  400: tokenColor("--color-text-muted"),
  500: tokenColor("--color-text-muted"),
  600: tokenColor("--color-text-default"),
  700: tokenColor("--color-text-default"),
  800: tokenColor("--color-text-default"),
  900: tokenColor("--color-text-default"),
  950: tokenColor("--color-chrome-platform"),
};

/**
 * EduMyles Design System v1.0 — Tailwind CSS Configuration
 * Semantic colours resolve from the generated design-token CSS.
 * Do NOT hardcode hex values in components — use token-based classes.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      /* ── Fonts ────────────────────────────────────────────────────── */
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-inter)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        jakarta: ["var(--font-inter)", "system-ui", "sans-serif"],
      },

      /* ── Colours ──────────────────────────────────────────────────── */
      colors: {
        /* Legacy Tailwind palette names map to semantic tokens while the
           route tree migrates. Existing status and neutral classes therefore
           stay consistent in light and dark mode. */
        emerald: statusScale("success"),
        white: tokenColor("--color-text-inverse"),
        black: tokenColor("--color-text-default"),
        lime: statusScale("success"),
        rose: statusScale("danger"),
        pink: statusScale("danger"),
        orange: statusScale("warning"),
        teal: brandScale("primary"),
        cyan: statusScale("info"),
        sky: statusScale("info"),
        indigo: brandScale("primary"),
        purple: brandScale("info"),
        violet: brandScale("info"),
        zinc: neutralScale,
        stone: neutralScale,
        amber: {
          50: tokenColor("--color-status-warning-subtle"),
          100: tokenColor("--color-status-warning-subtle"),
          200: tokenColor("--color-status-warning-subtle"),
          300: tokenColor("--color-status-warning-solid"),
          400: tokenColor("--color-status-warning-solid"),
          500: tokenColor("--color-status-warning-solid"),
          600: tokenColor("--color-status-warning-on-subtle"),
          700: tokenColor("--color-status-warning-on-subtle"),
          800: tokenColor("--color-status-warning-on-subtle"),
          900: tokenColor("--color-status-warning-on-subtle"),
          950: tokenColor("--color-status-warning-on-subtle"),
        },
        yellow: {
          50: tokenColor("--color-status-warning-subtle"),
          100: tokenColor("--color-status-warning-subtle"),
          200: tokenColor("--color-status-warning-subtle"),
          300: tokenColor("--color-status-warning-solid"),
          400: tokenColor("--color-status-warning-solid"),
          500: tokenColor("--color-status-warning-solid"),
          600: tokenColor("--color-status-warning-on-subtle"),
          700: tokenColor("--color-status-warning-on-subtle"),
          800: tokenColor("--color-status-warning-on-subtle"),
          900: tokenColor("--color-status-warning-on-subtle"),
          950: tokenColor("--color-status-warning-on-subtle"),
        },
        green: {
          50: tokenColor("--color-status-success-subtle"),
          100: tokenColor("--color-status-success-subtle"),
          200: tokenColor("--color-status-success-subtle"),
          300: tokenColor("--color-status-success-solid"),
          400: tokenColor("--color-status-success-solid"),
          500: tokenColor("--color-status-success-solid"),
          600: tokenColor("--color-status-success-on-subtle"),
          700: tokenColor("--color-status-success-on-subtle"),
          800: tokenColor("--color-status-success-on-subtle"),
          900: tokenColor("--color-status-success-on-subtle"),
          950: tokenColor("--color-status-success-on-subtle"),
        },
        red: {
          50: tokenColor("--color-status-danger-subtle"),
          100: tokenColor("--color-status-danger-subtle"),
          200: tokenColor("--color-status-danger-subtle"),
          300: tokenColor("--color-status-danger-solid"),
          400: tokenColor("--color-status-danger-solid"),
          500: tokenColor("--color-status-danger-solid"),
          600: tokenColor("--color-status-danger-on-subtle"),
          700: tokenColor("--color-status-danger-on-subtle"),
          800: tokenColor("--color-status-danger-on-subtle"),
          900: tokenColor("--color-status-danger-on-subtle"),
          950: tokenColor("--color-status-danger-on-subtle"),
        },
        blue: {
          50: tokenColor("--color-action-primary-subtle"),
          100: tokenColor("--color-action-primary-subtle"),
          200: tokenColor("--color-action-primary-subtle"),
          300: tokenColor("--color-action-primary"),
          400: tokenColor("--color-action-primary"),
          500: tokenColor("--color-action-primary"),
          600: tokenColor("--color-action-primary"),
          700: tokenColor("--color-action-primary"),
          800: tokenColor("--color-text-on-primary-subtle"),
          900: tokenColor("--color-text-on-primary-subtle"),
          950: tokenColor("--color-chrome-platform"),
        },
        steel: {
          50: tokenColor("--color-action-accent"),
          100: tokenColor("--color-action-accent"),
          200: tokenColor("--color-action-accent"),
          300: tokenColor("--color-action-accent"),
          400: tokenColor("--color-action-accent"),
          500: tokenColor("--color-action-accent"),
          600: tokenColor("--color-action-accent"),
          700: tokenColor("--color-action-accent"),
          800: tokenColor("--color-action-accent"),
          900: tokenColor("--color-action-accent"),
        },
        slate: {
          50: tokenColor("--color-surface-page"),
          100: tokenColor("--color-surface-sunken"),
          200: tokenColor("--color-border-default"),
          300: tokenColor("--color-border-default"),
          400: tokenColor("--color-text-muted"),
          500: tokenColor("--color-text-muted"),
          600: tokenColor("--color-text-default"),
          700: tokenColor("--color-text-default"),
          800: tokenColor("--color-text-default"),
          900: tokenColor("--color-text-default"),
          950: tokenColor("--color-chrome-platform"),
        },
        gray: {
          50: tokenColor("--color-surface-page"),
          100: tokenColor("--color-surface-sunken"),
          200: tokenColor("--color-border-default"),
          300: tokenColor("--color-border-default"),
          400: tokenColor("--color-text-muted"),
          500: tokenColor("--color-text-muted"),
          600: tokenColor("--color-text-default"),
          700: tokenColor("--color-text-default"),
          800: tokenColor("--color-text-default"),
          900: tokenColor("--color-text-default"),
          950: tokenColor("--color-chrome-platform"),
        },
        /* ── Shadcn/ui semantic tokens — point to v3 CSS vars ─────── */
        border: tokenColor("--color-border-default"),
        input: tokenColor("--color-border-strong"),
        ring: tokenColor("--color-focus-ring"),
        background: tokenColor("--color-surface-page"),
        foreground: tokenColor("--color-text-default"),

        muted: {
          DEFAULT: tokenColor("--color-surface-sunken"),
          foreground: tokenColor("--color-text-muted"),
        },
        /* shadcn accent = subtle hover surface (ghost buttons, etc.) */
        accent: {
          DEFAULT: tokenColor("--color-action-primary-subtle"),
          foreground: tokenColor("--color-text-on-primary-subtle"),
        },
        secondary: {
          DEFAULT: tokenColor("--color-surface-sunken"),
          foreground: tokenColor("--color-text-default"),
        },
        destructive: {
          DEFAULT: tokenColor("--color-status-danger-solid"),
          foreground: tokenColor("--color-status-danger-on-solid"),
        },
        card: {
          DEFAULT: tokenColor("--color-surface-default"),
          foreground: tokenColor("--color-text-default"),
        },
        popover: {
          DEFAULT: tokenColor("--color-surface-raised"),
          foreground: tokenColor("--color-text-default"),
        },
        sidebar: {
          DEFAULT: "var(--sidebar-bg)",
          foreground: "var(--sidebar-text-active)",
          bg: "var(--sidebar-bg)",
          text: "var(--sidebar-text)",
          icon: "var(--sidebar-icon)",
          active: "var(--sidebar-active)",
          "text-active": "var(--sidebar-text-active)",
          primary: "var(--sidebar-text-active)",
          "primary-foreground": "var(--sidebar-bg)",
          accent: "var(--sidebar-active)",
          "accent-foreground": "var(--sidebar-text-active)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-active)",
        },

        /* ── Tenant brand and compatibility aliases ───────────────── */
        primary: {
          DEFAULT: tokenColor("--color-action-primary"),
          foreground: tokenColor("--color-text-on-primary"),
          light: tokenColor("--color-action-primary"),
          dark: tokenColor("--color-action-primary"),
          "10": "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
          emerald: "var(--color-status-success-solid)",
          mint: "var(--color-status-success-on-subtle)",
        },
        /* Legacy product classes now resolve to semantic accent/status tokens. */
        "em-accent": {
          DEFAULT: tokenColor("--color-action-primary"),
          light: tokenColor("--color-action-primary"),
          dark: tokenColor("--color-action-primary"),
          pale: tokenColor("--color-action-primary-subtle"),
        },
        "em-accent-bg": tokenColor("--color-action-primary-subtle"),
        "em-warning": tokenColor("--color-status-warning-solid"),
        "em-warning-bg": tokenColor("--color-status-warning-subtle"),
        "em-success": tokenColor("--color-status-success-solid"),
        "em-success-bg": tokenColor("--color-status-success-subtle"),
        "em-danger": tokenColor("--color-status-danger-solid"),
        "em-danger-bg": tokenColor("--color-status-danger-subtle"),
        "em-info": tokenColor("--color-status-info-solid"),
        "em-info-bg": tokenColor("--color-status-info-subtle"),
        "em-yellow": {
          DEFAULT: "var(--gold-500)",
          light: "var(--color-status-warning-subtle)",
        },
        "em-ocean": {
          deep: tokenColor("--color-chrome-platform"),
          DEFAULT: tokenColor("--color-status-info-solid"),
          sky: tokenColor("--color-status-info-on-subtle"),
          pale: tokenColor("--color-status-info-subtle"),
        },

        /* ── Semantic ─────────────────────────────────────────────── */
        info: {
          DEFAULT: tokenColor("--color-status-info-solid"),
          bg: tokenColor("--color-status-info-subtle"),
        },
        success: {
          DEFAULT: tokenColor("--color-status-success-solid"),
          bg: tokenColor("--color-status-success-subtle"),
        },
        "success-muted": tokenColor("--color-status-success-subtle"),
        "success-muted-foreground": tokenColor("--color-status-success-on-subtle"),
        warning: {
          DEFAULT: tokenColor("--color-status-warning-solid"),
          bg: tokenColor("--color-status-warning-subtle"),
        },
        "warning-muted": tokenColor("--color-status-warning-subtle"),
        "warning-muted-foreground": tokenColor("--color-status-warning-on-subtle"),
        danger: {
          DEFAULT: tokenColor("--color-status-danger-solid"),
          bg: tokenColor("--color-status-danger-subtle"),
        },
        "danger-muted": tokenColor("--color-status-danger-subtle"),
        "danger-muted-foreground": tokenColor("--color-status-danger-on-subtle"),
        "info-muted": tokenColor("--color-status-info-subtle"),
        "info-muted-foreground": tokenColor("--color-status-info-on-subtle"),

        /* Deprecated names retained as semantic aliases during page migration. */
        "success-bg": tokenColor("--color-status-success-subtle"),
        "warning-bg": tokenColor("--color-status-warning-subtle"),
        "danger-bg": tokenColor("--color-status-danger-subtle"),
        "info-bg": tokenColor("--color-status-info-subtle"),

        /* ── Neutral Scale ────────────────────────────────────────── */
        neutral: {
          50: "var(--color-surface-page)",
          100: "var(--muted)",
          200: "var(--color-border-default)",
          400: "var(--muted)",
          500: "var(--secondary-foreground)",
          700: "var(--foreground)",
          900: "var(--color-chrome-platform)",
        },
        platform: {
          chrome: tokenColor("--color-chrome-platform"),
        },

        /* ── Role-based identity colours ─────────────────────────── */
        role: {
          "super-admin": "var(--color-chrome-platform)",
          "school-admin": "var(--color-action-primary)",
          teacher: "var(--color-status-success-solid)",
          finance: "var(--color-status-warning-solid)",
          parent: "var(--color-status-info-solid)",
          student: "var(--color-text-on-primary-subtle)",
        },

        /* ── Data Visualisation chart palette ─────────────────────── */
        chart: {
          "1": "var(--color-action-primary)",
          "2": "var(--color-status-success-solid)",
          "3": "var(--color-status-info-solid)",
          "4": "var(--color-status-warning-solid)",
          "5": "var(--muted)",
          "6": "var(--color-status-danger-solid)",
        },

        /* ── Marketing accent (landing pages ONLY, not product UI) ── */
        marketing: { amber: "var(--gold-500)" },
      },

      /* ── Spacing ──────────────────────────────────────────────────── */
      spacing: {
        0: "var(--spacing-0)",
        1: "var(--spacing-1)",
        2: "var(--spacing-2)",
        3: "var(--spacing-3)",
        4: "var(--spacing-4)",
        5: "var(--spacing-5)",
        6: "var(--spacing-6)",
        8: "var(--spacing-8)",
        10: "var(--spacing-10)",
        12: "var(--spacing-12)",
        16: "var(--spacing-16)",
        20: "var(--spacing-20)",
      },

      /* ── Shadows ──────────────────────────────────────────────────── */
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "em-sm": "var(--shadow-sm)",
        "em-md": "var(--shadow-md)",
        "em-lg": "var(--shadow-lg)",
        "em-xl": "var(--shadow-xl)",
      },

      /* ── Border Radius ────────────────────────────────────────────── */
      borderRadius: {
        sm: "var(--radius-badge)",
        md: "var(--radius-control)",
        lg: "var(--radius-card)",
        xl: "var(--radius-dialog)",
        card: "var(--radius-card)",
      },

      /* ── Font Sizes ───────────────────────────────────────────────── */
      fontSize: {
        display: ["32px", { lineHeight: "40px", fontWeight: "600" }],
        h1: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        h2: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        h3: ["16px", { lineHeight: "24px", fontWeight: "600" }],
        h4: ["14px", { lineHeight: "20px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "22px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        label: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        button: ["14px", { lineHeight: "20px", fontWeight: "500" }],
        hero: ["60px", { lineHeight: "1.1", fontWeight: "700" }],
        section: ["40px", { lineHeight: "1.15", fontWeight: "700" }],
        "body-lg": ["17px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "500" }],
      },

      /* ── Max Width ────────────────────────────────────────────────── */
      maxWidth: {
        page: "var(--layout-contentMax)",
      },
      height: {
        header: "var(--layout-header)",
        "header-mobile": "var(--layout-headerMobile)",
      },
      width: {
        sidebar: "var(--layout-sidebar)",
        "sidebar-collapsed": "var(--layout-sidebarCollapsed)",
      },

      /* ── Animations ───────────────────────────────────────────────── */
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite", // skeleton loaders
        "fade-in": "fade-in 0.2s ease-out", // dropdowns, modals
        "slide-in": "slide-in-right 0.3s ease-out", // toast notifications
      },
    },
  },
  plugins: [animate],
};

export default config;
