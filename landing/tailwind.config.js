/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A395B",
          dark: "#122843",
          light: "#2A4F7C",
        },
        gold: {
          DEFAULT: "#C79639",
          dark: "#A67C2A",
          light: "#D9AE5A",
        },
        "off-white": "#F8FAFC",
        "light-blue": "#C7D7EF",
        "light-grey": "#E8EDF4",
        "mid-grey": "#545454",
        "dark-grey": "#212121",
      },
      fontFamily: {
        jakarta: ["var(--font-jakarta)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "pulse-ring": "pulseRing 3s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
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
        "gold-glow": "0 0 30px rgba(199, 150, 57, 0.3)",
        "navy-glow": "0 0 30px rgba(26, 57, 91, 0.3)",
        "card": "0 2px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        'btn': '8px',
        'card': '12px',
        'card-lg': '16px',
      },
    },
  },
  plugins: [],
};
