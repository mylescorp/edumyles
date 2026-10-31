import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const statusScale = (name: "success" | "warning" | "danger" | "info") => ({
  50: `rgb(var(--${name}-muted-rgb) / <alpha-value>)`,
  100: `rgb(var(--${name}-muted-rgb) / <alpha-value>)`,
  200: `rgb(var(--${name}-muted-rgb) / <alpha-value>)`,
  300: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  400: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  500: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  600: `rgb(var(--${name}-muted-foreground-rgb) / <alpha-value>)`,
  700: `rgb(var(--${name}-muted-foreground-rgb) / <alpha-value>)`,
  800: `rgb(var(--${name}-muted-foreground-rgb) / <alpha-value>)`,
  900: `rgb(var(--${name}-muted-foreground-rgb) / <alpha-value>)`,
  950: `rgb(var(--${name}-muted-foreground-rgb) / <alpha-value>)`,
});

const brandScale = (name: "primary" | "info") => ({
  50: `rgb(var(--${name === "primary" ? "accent" : "info-muted"}-rgb) / <alpha-value>)`,
  100: `rgb(var(--${name === "primary" ? "accent" : "info-muted"}-rgb) / <alpha-value>)`,
  200: `rgb(var(--${name === "primary" ? "accent" : "info-muted"}-rgb) / <alpha-value>)`,
  300: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  400: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  500: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  600: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  700: `rgb(var(--${name}-rgb) / <alpha-value>)`,
  800: `rgb(var(--accent-foreground-rgb) / <alpha-value>)`,
  900: `rgb(var(--accent-foreground-rgb) / <alpha-value>)`,
  950: `rgb(var(--platform-chrome-rgb) / <alpha-value>)`,
});

const neutralScale = {
  50: "rgb(var(--background-rgb) / <alpha-value>)",
  100: "rgb(var(--muted-rgb) / <alpha-value>)",
  200: "rgb(var(--border-rgb) / <alpha-value>)",
  300: "rgb(var(--border-rgb) / <alpha-value>)",
  400: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
  500: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
  600: "rgb(var(--secondary-foreground-rgb) / <alpha-value>)",
  700: "rgb(var(--foreground-rgb) / <alpha-value>)",
  800: "rgb(var(--foreground-rgb) / <alpha-value>)",
  900: "rgb(var(--foreground-rgb) / <alpha-value>)",
  950: "rgb(var(--platform-chrome-rgb) / <alpha-value>)",
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
          50: "rgb(var(--warning-muted-rgb) / <alpha-value>)",
          100: "rgb(var(--warning-muted-rgb) / <alpha-value>)",
          200: "rgb(var(--warning-muted-rgb) / <alpha-value>)",
          300: "rgb(var(--warning-rgb) / <alpha-value>)",
          400: "rgb(var(--warning-rgb) / <alpha-value>)",
          500: "rgb(var(--warning-rgb) / <alpha-value>)",
          600: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          700: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          800: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          900: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          950: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
        },
        yellow: {
          50: "rgb(var(--warning-muted-rgb) / <alpha-value>)",
          100: "rgb(var(--warning-muted-rgb) / <alpha-value>)",
          200: "rgb(var(--warning-muted-rgb) / <alpha-value>)",
          300: "rgb(var(--warning-rgb) / <alpha-value>)",
          400: "rgb(var(--warning-rgb) / <alpha-value>)",
          500: "rgb(var(--warning-rgb) / <alpha-value>)",
          600: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          700: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          800: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          900: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
          950: "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
        },
        green: {
          50: "rgb(var(--success-muted-rgb) / <alpha-value>)",
          100: "rgb(var(--success-muted-rgb) / <alpha-value>)",
          200: "rgb(var(--success-muted-rgb) / <alpha-value>)",
          300: "rgb(var(--success-rgb) / <alpha-value>)",
          400: "rgb(var(--success-rgb) / <alpha-value>)",
          500: "rgb(var(--success-rgb) / <alpha-value>)",
          600: "rgb(var(--success-muted-foreground-rgb) / <alpha-value>)",
          700: "rgb(var(--success-muted-foreground-rgb) / <alpha-value>)",
          800: "rgb(var(--success-muted-foreground-rgb) / <alpha-value>)",
          900: "rgb(var(--success-muted-foreground-rgb) / <alpha-value>)",
          950: "rgb(var(--success-muted-foreground-rgb) / <alpha-value>)",
        },
        red: {
          50: "rgb(var(--danger-muted-rgb) / <alpha-value>)",
          100: "rgb(var(--danger-muted-rgb) / <alpha-value>)",
          200: "rgb(var(--danger-muted-rgb) / <alpha-value>)",
          300: "rgb(var(--danger-rgb) / <alpha-value>)",
          400: "rgb(var(--danger-rgb) / <alpha-value>)",
          500: "rgb(var(--danger-rgb) / <alpha-value>)",
          600: "rgb(var(--danger-muted-foreground-rgb) / <alpha-value>)",
          700: "rgb(var(--danger-muted-foreground-rgb) / <alpha-value>)",
          800: "rgb(var(--danger-muted-foreground-rgb) / <alpha-value>)",
          900: "rgb(var(--danger-muted-foreground-rgb) / <alpha-value>)",
          950: "rgb(var(--danger-muted-foreground-rgb) / <alpha-value>)",
        },
        blue: {
          50: "rgb(var(--accent-rgb) / <alpha-value>)",
          100: "rgb(var(--accent-rgb) / <alpha-value>)",
          200: "rgb(var(--accent-rgb) / <alpha-value>)",
          300: "rgb(var(--primary-rgb) / <alpha-value>)",
          400: "rgb(var(--primary-rgb) / <alpha-value>)",
          500: "rgb(var(--primary-rgb) / <alpha-value>)",
          600: "rgb(var(--primary-rgb) / <alpha-value>)",
          700: "rgb(var(--primary-rgb) / <alpha-value>)",
          800: "rgb(var(--accent-foreground-rgb) / <alpha-value>)",
          900: "rgb(var(--accent-foreground-rgb) / <alpha-value>)",
          950: "rgb(var(--platform-chrome-rgb, var(--primary-rgb)) / <alpha-value>)",
        },
        steel: {
          50: "rgb(var(--steel-50-rgb) / <alpha-value>)",
          100: "rgb(var(--steel-100-rgb) / <alpha-value>)",
          200: "rgb(var(--steel-200-rgb) / <alpha-value>)",
          300: "rgb(var(--steel-300-rgb) / <alpha-value>)",
          400: "rgb(var(--steel-400-rgb) / <alpha-value>)",
          500: "rgb(var(--steel-500-rgb) / <alpha-value>)",
          600: "rgb(var(--steel-600-rgb) / <alpha-value>)",
          700: "rgb(var(--steel-700-rgb) / <alpha-value>)",
          800: "rgb(var(--steel-800-rgb) / <alpha-value>)",
          900: "rgb(var(--steel-900-rgb) / <alpha-value>)",
        },
        slate: {
          50: "rgb(var(--background-rgb) / <alpha-value>)",
          100: "rgb(var(--muted-rgb) / <alpha-value>)",
          200: "rgb(var(--border-rgb) / <alpha-value>)",
          300: "rgb(var(--border-rgb) / <alpha-value>)",
          400: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
          500: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
          600: "rgb(var(--secondary-foreground-rgb) / <alpha-value>)",
          700: "rgb(var(--foreground-rgb) / <alpha-value>)",
          800: "rgb(var(--foreground-rgb) / <alpha-value>)",
          900: "rgb(var(--foreground-rgb) / <alpha-value>)",
          950: "rgb(var(--platform-chrome-rgb, var(--primary-rgb)) / <alpha-value>)",
        },
        gray: {
          50: "rgb(var(--background-rgb) / <alpha-value>)",
          100: "rgb(var(--muted-rgb) / <alpha-value>)",
          200: "rgb(var(--border-rgb) / <alpha-value>)",
          300: "rgb(var(--border-rgb) / <alpha-value>)",
          400: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
          500: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
          600: "rgb(var(--secondary-foreground-rgb) / <alpha-value>)",
          700: "rgb(var(--foreground-rgb) / <alpha-value>)",
          800: "rgb(var(--foreground-rgb) / <alpha-value>)",
          900: "rgb(var(--foreground-rgb) / <alpha-value>)",
          950: "rgb(var(--platform-chrome-rgb, var(--primary-rgb)) / <alpha-value>)",
        },
        /* ── Shadcn/ui semantic tokens — point to v3 CSS vars ─────── */
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        input: "rgb(var(--input-rgb) / <alpha-value>)",
        ring: "rgb(var(--ring-rgb) / <alpha-value>)",
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",

        muted: {
          DEFAULT: "rgb(var(--muted-rgb) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground-rgb) / <alpha-value>)",
        },
        /* shadcn accent = subtle hover surface (ghost buttons, etc.) */
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground-rgb) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary-rgb) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground-rgb) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--danger-rgb) / <alpha-value>)",
          foreground: "rgb(var(--danger-foreground-rgb) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card-rgb) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground-rgb) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover-rgb) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground-rgb) / <alpha-value>)",
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
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground-rgb) / <alpha-value>)",
          light: "rgb(var(--primary-rgb) / <alpha-value>)",
          dark: "rgb(var(--primary-rgb) / <alpha-value>)",
          "10": "rgb(var(--primary-rgb) / 0.10)",
          emerald: "var(--success)",
          mint: "var(--success-muted-foreground)",
        },
        /* Legacy product classes now resolve to semantic accent/status tokens. */
        "em-accent": {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          light: "rgb(var(--primary-rgb) / <alpha-value>)",
          dark: "rgb(var(--primary-rgb) / <alpha-value>)",
          pale: "rgb(var(--accent-rgb) / <alpha-value>)",
        },
        "em-accent-bg": "rgb(var(--accent-rgb) / <alpha-value>)",
        "em-warning": "rgb(var(--warning-rgb) / <alpha-value>)",
        "em-warning-bg": "rgb(var(--warning-muted-rgb) / <alpha-value>)",
        "em-success": "rgb(var(--success-rgb) / <alpha-value>)",
        "em-success-bg": "rgb(var(--success-muted-rgb) / <alpha-value>)",
        "em-danger": "rgb(var(--danger-rgb) / <alpha-value>)",
        "em-danger-bg": "rgb(var(--danger-muted-rgb) / <alpha-value>)",
        "em-info": "rgb(var(--info-rgb) / <alpha-value>)",
        "em-info-bg": "rgb(var(--info-muted-rgb) / <alpha-value>)",
        "em-yellow": {
          DEFAULT: "var(--gold-500)",
          light: "var(--warning-muted)",
        },
        "em-ocean": {
          deep: "rgb(var(--platform-chrome-rgb) / <alpha-value>)",
          DEFAULT: "rgb(var(--info-rgb) / <alpha-value>)",
          sky: "rgb(var(--info-muted-foreground-rgb) / <alpha-value>)",
          pale: "rgb(var(--info-muted-rgb) / <alpha-value>)",
        },

        /* ── Semantic ─────────────────────────────────────────────── */
        info: {
          DEFAULT: "rgb(var(--info-rgb) / <alpha-value>)",
          bg: "rgb(var(--info-muted-rgb) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success-rgb) / <alpha-value>)",
          bg: "rgb(var(--success-muted-rgb) / <alpha-value>)",
        },
        "success-muted": "rgb(var(--success-muted-rgb) / <alpha-value>)",
        "success-muted-foreground": "rgb(var(--success-muted-foreground-rgb) / <alpha-value>)",
        warning: {
          DEFAULT: "rgb(var(--warning-rgb) / <alpha-value>)",
          bg: "rgb(var(--warning-muted-rgb) / <alpha-value>)",
        },
        "warning-muted": "rgb(var(--warning-muted-rgb) / <alpha-value>)",
        "warning-muted-foreground": "rgb(var(--warning-muted-foreground-rgb) / <alpha-value>)",
        danger: {
          DEFAULT: "rgb(var(--danger-rgb) / <alpha-value>)",
          bg: "rgb(var(--danger-muted-rgb) / <alpha-value>)",
        },
        "danger-muted": "rgb(var(--danger-muted-rgb) / <alpha-value>)",
        "danger-muted-foreground": "rgb(var(--danger-muted-foreground-rgb) / <alpha-value>)",
        "info-muted": "rgb(var(--info-muted-rgb) / <alpha-value>)",
        "info-muted-foreground": "rgb(var(--info-muted-foreground-rgb) / <alpha-value>)",

        /* Deprecated names retained as semantic aliases during page migration. */
        "success-bg": "rgb(var(--success-muted-rgb) / <alpha-value>)",
        "warning-bg": "rgb(var(--warning-muted-rgb) / <alpha-value>)",
        "danger-bg": "rgb(var(--danger-muted-rgb) / <alpha-value>)",
        "info-bg": "rgb(var(--info-muted-rgb) / <alpha-value>)",

        /* ── Neutral Scale ────────────────────────────────────────── */
        neutral: {
          50: "var(--background)",
          100: "var(--muted)",
          200: "var(--border)",
          400: "var(--muted-foreground)",
          500: "var(--secondary-foreground)",
          700: "var(--foreground)",
          900: "var(--platform-chrome)",
        },
        platform: {
          chrome: "rgb(var(--platform-chrome-rgb) / <alpha-value>)",
        },

        /* ── Role-based identity colours ─────────────────────────── */
        role: {
          "super-admin": "var(--platform-chrome)",
          "school-admin": "var(--primary)",
          teacher: "var(--success)",
          finance: "var(--warning)",
          parent: "var(--info)",
          student: "var(--accent-foreground)",
        },

        /* ── Data Visualisation chart palette ─────────────────────── */
        chart: {
          "1": "var(--primary)",
          "2": "var(--success)",
          "3": "var(--info)",
          "4": "var(--warning)",
          "5": "var(--muted-foreground)",
          "6": "var(--danger)",
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
