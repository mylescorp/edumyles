/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Forest Green Family (primary brand) ──
        "forest-deep": "#061A12",
        "forest-dark": "#0C3020",
        "forest": "#0F4C2A",
        "emerald-green": "#1A7A4A",
        "leaf": "#26A65B",
        "mint": "#A8E6C3",
        // ── Gold Family ──
        gold: {
          DEFAULT: "#E8A020",
          light: "#F5C453",
          deep: "#9A5D00",
          pale: "#FEF3DC",
          dark: "#C78A10",
        },
        // ── Sky Blue ──
        sky: {
          DEFAULT: "#90CAF9",
          pale: "#E3F2FD",
        },
        // ── Ocean Blue ──
        ocean: {
          DEFAULT: "#1565C0",
          deep: "#001535",
        },
        // ── Neutrals ──
        "sage-muted": "#6B9E83",
        "off-white": "#F3FBF6",
        // ── Legacy (keep for other pages) ──
        navy: {
          DEFAULT: "#1A395B",
          dark: "#122843",
          light: "#2A4F7C",
        },
        "light-blue": "#C7D7EF",
        "light-grey": "#E8EDF4",
        "mid-grey": "#545454",
        "dark-grey": "#212121",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "Times New Roman", "serif"],
        jakarta: ["var(--font-jakarta)", "ui-sans-serif", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        inter: ["var(--font-jakarta)", "ui-sans-serif", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "'Cascadia Code'", "'Fira Code'", "monospace"],
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "float-delay": "float 3.5s ease-in-out 0.5s infinite",
        "float-slow": "float 4s ease-in-out 1s infinite",
        "pulse-ring": "pulseRing 3s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.3)", opacity: "0.5" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "gold-glow": "0 0 30px rgba(232, 160, 32, 0.3)",
        "navy-glow": "0 0 30px rgba(26, 57, 91, 0.3)",
        "card": "0 2px 12px rgba(0,0,0,0.08)",
        "card-dark": "0 8px 32px rgba(0,0,0,0.3)",
      },
      borderRadius: {
        btn: "8px",
        card: "12px",
        "card-lg": "16px",
      },
    },
  },
  plugins: [],
};
