import { describe, expect, it } from "vitest";
import { getNavItemsForRole, getRoleDashboard } from "@/lib/routes";

describe("partner portal routing", () => {
  it("redirects approved partner roles to their dedicated portals", () => {
    expect(getRoleDashboard("affiliate")).toBe("/portal/affiliate");
    expect(getRoleDashboard("reseller")).toBe("/portal/reseller");
    expect(getRoleDashboard("developer")).toBe("/portal/developer");
  });

  it("gives partner roles nav items rooted in the matching portal", () => {
    const rolePaths = {
      affiliate: "/portal/affiliate",
      reseller: "/portal/reseller",
      developer: "/portal/developer",
    };

    for (const [role, rootPath] of Object.entries(rolePaths)) {
      const navItems = getNavItemsForRole(role);
      expect(navItems.length).toBeGreaterThan(0);
      expect(navItems[0].href).toBe(rootPath);
      expect(navItems.every((item) => item.href.startsWith(rootPath))).toBe(true);
    }
  });
});
