export const SOCIAL_PLATFORM_LIMITS: Record<string, number | null> = {
  facebook: 63206,
  instagram: 2200,
  twitter: 280,
  linkedin: 3000,
  youtube: 5000,
  tiktok: 2200,
  whatsapp: 4096,
  telegram: 4096,
};

export function getPlatformCharacterLimit(platform: string) {
  return SOCIAL_PLATFORM_LIMITS[platform] ?? null;
}

export function buildTwitterThreadParts(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildSocialTrend(rows: any[]) {
  const grouped = new Map<string, { label: string; impressions: number; reach: number; engagements: number }>();

  for (const row of rows) {
    const date = new Date(row.periodEnd ?? row.pulledAt ?? Date.now());
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    const current = grouped.get(label) ?? { label, impressions: 0, reach: 0, engagements: 0 };
    current.impressions += row.impressions ?? 0;
    current.reach += row.reach ?? 0;
    current.engagements += row.engagements ?? 0;
    grouped.set(label, current);
  }

  return Array.from(grouped.values());
}

export function buildPlatformBreakdown(rows: any[]) {
  const grouped = new Map<
    string,
    { platform: string; impressions: number; reach: number; engagements: number; followers: number }
  >();

  for (const row of rows) {
    const key = row.platform ?? "unknown";
    const current = grouped.get(key) ?? {
      platform: key,
      impressions: 0,
      reach: 0,
      engagements: 0,
      followers: 0,
    };
    current.impressions += row.impressions ?? 0;
    current.reach += row.reach ?? 0;
    current.engagements += row.engagements ?? 0;
    current.followers += row.followerGrowth ?? 0;
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.impressions - a.impressions);
}

export function getCalendarRange(view: "month" | "week", focusedDate: Date) {
  if (view === "week") {
    const start = new Date(focusedDate);
    start.setHours(0, 0, 0, 0);
    const weekday = start.getDay();
    start.setDate(start.getDate() - weekday);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  const start = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function groupPostsByCalendarDay(posts: any[]) {
  return posts.reduce<Record<string, any[]>>((accumulator, post) => {
    const date = new Date(post.scheduledAt ?? post.createdAt);
    const key = date.toISOString().slice(0, 10);
    accumulator[key] = accumulator[key] ?? [];
    accumulator[key].push(post);
    return accumulator;
  }, {});
}

export function sameCalendarDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

export function formatCalendarDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
