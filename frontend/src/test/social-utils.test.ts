import { describe, expect, it } from "vitest";
import {
  buildPlatformBreakdown,
  buildSocialTrend,
  buildTwitterThreadParts,
  formatCalendarDateKey,
  getCalendarRange,
  getPlatformCharacterLimit,
  groupPostsByCalendarDay,
  sameCalendarDay,
} from "@/components/social/social-utils";

describe("social-utils", () => {
  it("returns platform character limits", () => {
    expect(getPlatformCharacterLimit("twitter")).toBe(280);
    expect(getPlatformCharacterLimit("facebook")).toBe(63206);
    expect(getPlatformCharacterLimit("unknown")).toBeNull();
  });

  it("splits twitter threads on blank lines", () => {
    expect(buildTwitterThreadParts("One\n\nTwo\n\n Three ")).toEqual(["One", "Two", "Three"]);
  });

  it("builds a social trend grouped by day", () => {
    const rows = [
      { periodEnd: new Date("2026-04-20T10:00:00Z").getTime(), impressions: 10, reach: 5, engagements: 2 },
      { periodEnd: new Date("2026-04-20T13:00:00Z").getTime(), impressions: 15, reach: 8, engagements: 4 },
      { periodEnd: new Date("2026-04-21T13:00:00Z").getTime(), impressions: 7, reach: 3, engagements: 1 },
    ];

    expect(buildSocialTrend(rows)).toEqual([
      { label: "4/20", impressions: 25, reach: 13, engagements: 6 },
      { label: "4/21", impressions: 7, reach: 3, engagements: 1 },
    ]);
  });

  it("builds platform breakdown totals", () => {
    const rows = [
      { platform: "facebook", impressions: 10, reach: 5, engagements: 2, followerGrowth: 1 },
      { platform: "facebook", impressions: 15, reach: 7, engagements: 3, followerGrowth: 2 },
      { platform: "twitter", impressions: 12, reach: 6, engagements: 4, followerGrowth: 0 },
    ];

    expect(buildPlatformBreakdown(rows)).toEqual([
      { platform: "facebook", impressions: 25, reach: 12, engagements: 5, followers: 3 },
      { platform: "twitter", impressions: 12, reach: 6, engagements: 4, followers: 0 },
    ]);
  });

  it("builds month and week calendar ranges", () => {
    const focusedDate = new Date("2026-04-15T08:00:00Z");
    expect(getCalendarRange("week", focusedDate)).toHaveLength(7);
    expect(getCalendarRange("month", focusedDate)).toHaveLength(42);
  });

  it("groups posts by calendar day", () => {
    const posts = [
      { _id: "a", scheduledAt: new Date("2026-04-10T08:00:00Z").getTime() },
      { _id: "b", scheduledAt: new Date("2026-04-10T12:00:00Z").getTime() },
      { _id: "c", createdAt: new Date("2026-04-11T12:00:00Z").getTime() },
    ];

    expect(groupPostsByCalendarDay(posts)).toEqual({
      "2026-04-10": [posts[0], posts[1]],
      "2026-04-11": [posts[2]],
    });
  });

  it("compares calendar days and formats keys", () => {
    const left = new Date("2026-04-12T08:00:00Z");
    const right = new Date("2026-04-12T15:00:00Z");
    const other = new Date("2026-04-13T08:00:00Z");

    expect(sameCalendarDay(left, right)).toBe(true);
    expect(sameCalendarDay(left, other)).toBe(false);
    expect(formatCalendarDateKey(left)).toBe("2026-04-12");
  });
});
