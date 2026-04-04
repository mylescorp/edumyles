/**
 * Theme unit tests — verify the mobile theme correctly maps brand tokens
 * from the shared design system and that RN-specific structures are valid.
 */

import { theme } from "../theme";

describe("theme.colors", () => {
  it("primary is forest green (not legacy blue)", () => {
    // Shared forest.600 = #045e38 — confirm we're no longer using the old #2563eb blue
    expect(theme.colors.primary.toLowerCase()).not.toBe("#2563eb");
    // Should start with a forest green shade
    expect(theme.colors.primary.toLowerCase()).toMatch(/^#0[0-9a-f]/i);
  });

  it("all required color keys are present", () => {
    const required = [
      "primary", "secondary", "success", "warning", "error",
      "background", "surface", "card",
      "text", "textSecondary", "textLight",
      "white", "black", "border",
      "present", "absent", "late", "excused",
      "gradeA", "gradeB", "gradeC", "gradeD", "gradeF",
    ];
    required.forEach((key) => {
      expect(theme.colors).toHaveProperty(key);
      expect(typeof (theme.colors as Record<string, string>)[key]).toBe("string");
    });
  });

  it("hex colors have valid format", () => {
    const hexRe = /^#[0-9A-Fa-f]{3,6}$/;
    Object.entries(theme.colors).forEach(([key, value]) => {
      expect(hexRe.test(value), `${key}: "${value}" is not a valid hex colour`).toBe(true);
    });
  });
});

describe("theme.spacing", () => {
  it("all spacing values are positive integers", () => {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      expect(typeof value, `spacing.${key} should be a number`).toBe("number");
      expect(value, `spacing.${key} should be > 0`).toBeGreaterThan(0);
    });
  });

  it("values increase from xs to xxxl", () => {
    const { xs, sm, md, lg, xl, xxl, xxxl } = theme.spacing;
    expect(xs).toBeLessThan(sm);
    expect(sm).toBeLessThan(md);
    expect(md).toBeLessThan(lg);
    expect(lg).toBeLessThan(xl);
    expect(xl).toBeLessThan(xxl);
    expect(xxl).toBeLessThan(xxxl);
  });
});

describe("theme.shadows", () => {
  it("each shadow has the required React Native shadow props", () => {
    (["sm", "md", "lg"] as const).forEach((size) => {
      const s = theme.shadows[size];
      expect(s).toHaveProperty("shadowColor");
      expect(s).toHaveProperty("shadowOffset");
      expect(s.shadowOffset).toHaveProperty("width");
      expect(s.shadowOffset).toHaveProperty("height");
      expect(s).toHaveProperty("shadowOpacity");
      expect(s).toHaveProperty("shadowRadius");
      expect(s).toHaveProperty("elevation");
      // elevation increases with shadow size
      expect(typeof s.elevation).toBe("number");
      expect(s.elevation).toBeGreaterThan(0);
    });
  });

  it("elevation increases from sm to lg", () => {
    expect(theme.shadows.sm.elevation).toBeLessThan(theme.shadows.md.elevation);
    expect(theme.shadows.md.elevation).toBeLessThan(theme.shadows.lg.elevation);
  });
});

describe("theme.fontSizes", () => {
  it("all font sizes are positive numbers", () => {
    Object.entries(theme.fontSizes).forEach(([key, value]) => {
      expect(typeof value, `fontSizes.${key} should be a number`).toBe("number");
      expect(value, `fontSizes.${key} should be > 0`).toBeGreaterThan(0);
    });
  });
});

describe("theme.borderRadius", () => {
  it("full border radius is very large", () => {
    expect(theme.borderRadius.full).toBeGreaterThanOrEqual(999);
  });
});
