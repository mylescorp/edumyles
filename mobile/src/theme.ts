import { StyleSheet, Dimensions } from "react-native";
import { colors as sharedColors } from "@edumyles/shared";
import { fonts } from "./theme/typography";

const { width, height } = Dimensions.get("window");

// ── Brand colours mapped from the shared design system ───────────────────────
// The shared theme uses CSS strings for web; here we extract raw hex values
// and build a React Native–compatible theme.

export const theme = {
  colors: {
    // Brand — forest green from shared design tokens
    primary: sharedColors.forest[600], // #045e38 — dark forest green
    primaryLight: sharedColors.forest[400], // #3ea96f — lighter accent
    secondary: sharedColors.crimson[500], // #E42527 — action red

    // Semantic
    success: sharedColors.forest[500], // #056C40
    warning: sharedColors.amber[500], // #FFD731
    warningText: "#78350f",
    error: sharedColors.crimson[500], // #E42527
    info: "#0891b2",

    // Surfaces
    background: sharedColors.cream[50], // #ffffff
    surface: sharedColors.cream[100], // #FAFAFA
    card: sharedColors.cream[50], // #ffffff

    // Text
    text: sharedColors.charcoal[500], // #101010
    textSecondary: sharedColors.charcoal[300], // #808080
    textLight: sharedColors.charcoal[200], // #b3b3b3

    white: sharedColors.white,
    black: sharedColors.black,

    // Borders
    border: sharedColors.cream[400], // #E8E8E8
    separator: sharedColors.cream[300], // #F0F0F0

    // Attendance status
    present: sharedColors.forest[500],
    absent: sharedColors.crimson[500],
    late: "#ea580c",
    excused: "#6366f1",

    // Grade colours
    gradeA: sharedColors.forest[500],
    gradeB: "#0891b2",
    gradeC: sharedColors.amber[500],
    gradeD: "#ea580c",
    gradeF: sharedColors.crimson[500],
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  fonts: {
    body: fonts.body,
    bodyMedium: fonts.bodyMedium,
    displayMedium: fonts.displayMedium,
    display: fonts.display,
    regular: fonts.body,
    medium: fonts.bodyMedium,
    semibold: fonts.displayMedium,
    bold: fonts.display,
  },

  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // React Native shadow props (replaces CSS box-shadow strings)
  shadows: {
    sm: {
      shadowColor: sharedColors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: sharedColors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: sharedColors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  dimensions: {
    width,
    height,
    isSmallDevice: width < 380,
    isMediumDevice: width >= 380 && width < 768,
    isLargeDevice: width >= 768,
  },
} as const;

export type Theme = typeof theme;

export const createStyleSheet = <T extends StyleSheet.NamedStyles<T>>(styles: T): T =>
  StyleSheet.create(styles) as T;
