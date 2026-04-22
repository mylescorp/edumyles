// ============================================================
// EduMyles — Zoho One Inspired Design Tokens
// Shared across frontend, landing, and mobile
// ============================================================

// ----------------------------------------------------------
// Color Palette
// ----------------------------------------------------------
export const colors = {
  /** Deep Forest Green — primary brand, sidebar, trust */
  forest: {
    50: "#e8f5ee",
    100: "#c6e6d4",
    200: "#9dd4b6",
    300: "#6dbf94",
    400: "#3ea96f",
    500: "#056C40",
    600: "#045e38",
    700: "#034d2e",
    800: "#023c24",
    900: "#012b1a",
  },
  /** Crimson Red — CTAs, urgency, action buttons */
  crimson: {
    50: "#fdeaea",
    100: "#f9c4c5",
    200: "#f49a9b",
    300: "#ef6f70",
    400: "#ea4a4c",
    500: "#E42527",
    600: "#cc2123",
    700: "#a91b1d",
    800: "#871617",
    900: "#640f10",
  },
  /** Vivid Amber — highlights, badges, optimism */
  amber: {
    50: "#fff9e5",
    100: "#fff0b8",
    200: "#ffe68a",
    300: "#ffdc5c",
    400: "#ffd23e",
    500: "#FFD731",
    600: "#e6c12c",
    700: "#bf9f24",
    800: "#997f1d",
    900: "#735f15",
  },
  /** Charcoal — top bar, footer, primary text */
  charcoal: {
    50: "#f5f5f5",
    100: "#e0e0e0",
    200: "#b3b3b3",
    300: "#808080",
    400: "#4d4d4d",
    500: "#101010",
  },
  /** Off-White / Cream — section backgrounds */
  cream: {
    50: "#ffffff",
    100: "#FAFAFA",
    200: "#F8F8F8",
    300: "#F0F0F0",
    400: "#E8E8E8",
  },
  /** Blue — links, accents */
  blue: "#056CB8",
  /** Pure values */
  white: "#ffffff",
  black: "#000000",
} as const;

// ----------------------------------------------------------
// Typography
// ----------------------------------------------------------
export const typography = {
  fontFamily: {
    /** Primary UI font */
    primary: '"Inter", system-ui, sans-serif',
    /** Display font for headings and metrics */
    display: '"Plus Jakarta Sans", system-ui, sans-serif',
    /** Monospace — for code, tenant IDs */
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  fontSize: {
    /** Hero headline — 60px bold */
    hero: { size: "60px", lineHeight: "1.1", weight: "700" },
    /** Section header — 40px bold */
    section: { size: "40px", lineHeight: "1.15", weight: "700" },
    /** Large body — 17px regular (nav, body) */
    bodyLarge: { size: "17px", lineHeight: "1.5", weight: "400" },
    /** Standard body — 16px medium */
    body: { size: "16px", lineHeight: "1.5", weight: "500" },
    /** Small text — 14px */
    small: { size: "14px", lineHeight: "1.5", weight: "400" },
    /** Caption / label — 12px */
    caption: { size: "12px", lineHeight: "1.4", weight: "600" },
  },
} as const;

// ----------------------------------------------------------
// Spacing Scale (px)
// ----------------------------------------------------------
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
} as const;

// ----------------------------------------------------------
// Border Radius
// ----------------------------------------------------------
export const radii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "999px",
} as const;

// ----------------------------------------------------------
// Shadows
// ----------------------------------------------------------
export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px rgba(0, 0, 0, 0.07)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
} as const;

// ----------------------------------------------------------
// Breakpoints
// ----------------------------------------------------------
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ----------------------------------------------------------
// Layout
// ----------------------------------------------------------
export const layout = {
  maxWidth: "1300px",
  sidebarWidth: "256px",
  headerHeight: "64px",
  announcementBarHeight: "40px",
} as const;

// ----------------------------------------------------------
// Semantic Tokens (role-based)
// ----------------------------------------------------------
export const semantic = {
  background: colors.white,
  foreground: colors.charcoal[500],
  surface: colors.cream[200],
  border: colors.cream[400],
  muted: colors.charcoal[300],
  /** CTA / primary action */
  action: colors.crimson[500],
  actionHover: colors.crimson[600],
  /** Brand / identity */
  brand: colors.forest[500],
  brandDark: colors.forest[800],
  /** Success */
  success: colors.forest[500],
  successLight: colors.forest[50],
  /** Warning */
  warning: colors.amber[500],
  warningLight: colors.amber[50],
  /** Error / danger */
  error: colors.crimson[500],
  errorLight: colors.crimson[50],
  /** Info */
  info: colors.blue,
  /** Sidebar */
  sidebarBg: colors.forest[800],
  sidebarActive: colors.forest[500],
  sidebarText: "rgba(255, 255, 255, 0.75)",
  sidebarTextActive: colors.white,
  sidebarBorder: "rgba(255, 255, 255, 0.1)",
} as const;
