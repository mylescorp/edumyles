"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bug,
  Lightbulb,
  Link2,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { usePaginatedQuery } from "convex/react";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Entry = {
  _id: string;
  groupKey: string;
  isRelease: boolean;
  version: string;
  title: string;
  description: string;
  type: "feature" | "improvement" | "fix" | "breaking";
  module?: string;
  tags: string[];
  date: number;
  links?: Array<{ label: string; url: string }>;
};

const EMPTY_ENTRIES: Entry[] = [];
const NAIROBI_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;
const FILTERS = [
  { id: "all", label: "All" },
  { id: "feature", label: "New" },
  { id: "improvement", label: "Improvements" },
  { id: "fix", label: "Fixes" },
] as const;
const CATEGORY_LABEL: Record<Entry["type"], string> = {
  feature: "New",
  improvement: "Improvements",
  fix: "Fixes",
  breaking: "Breaking change",
};

function getSafeCount(value: unknown): number {
  let current = value;
  for (let depth = 0; depth < 3 && current && typeof current === "object"; depth += 1) {
    const result = current as { value?: unknown; data?: unknown };
    current = result.value ?? result.data;
  }
  return typeof current === "number" && Number.isFinite(current) ? current : 0;
}

function formatReleaseDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(new Date(timestamp));
}

function releaseDateBoundary(date: string, endOfDay = false) {
  if (!date) return undefined;
  const [year = NaN, month = NaN, day = NaN] = date.split("-").map(Number);
  const localDayBoundary = Date.UTC(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  // Convert the selected Nairobi calendar day (UTC+03:00) to a UTC timestamp.
  return localDayBoundary - NAIROBI_UTC_OFFSET_MS;
}

function getEntryUrl(routeBase: string, entry: Entry) {
  const pathname = entry.isRelease
    ? `${routeBase}/releases/${encodeURIComponent(entry.version)}`
    : routeBase;
  const url = new URL(pathname, window.location.origin);
  url.hash = `update-${encodeURIComponent(entry._id)}`;
  return url.toString();
}

export function WhatsNewPage({ version }: { version?: string }) {
  const pathname = usePathname() ?? "/admin/whats-new";
  const releasePathIndex = pathname.indexOf("/releases/");
  const routeBase =
    releasePathIndex >= 0 ? pathname.slice(0, releasePathIndex) : pathname.replace(/\/$/, "");
  const activeVersion = version ? decodeURIComponent(version) : undefined;
  const { sessionToken } = useAuth();
  const { installedModules } = useInstalledModules();
  const [category, setCategory] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [personalized, setPersonalized] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const openedScopeRef = useRef<string | null>(null);
  const lastScrolledHashRef = useRef<string | null>(null);
  const [linkedHistoryId] = useState<string | null>(() => {
    if (typeof window === "undefined" || !window.location.hash.startsWith("#update-")) return null;
    try {
      return decodeURIComponent(window.location.hash.slice("#update-".length));
    } catch {
      return null;
    }
  });
  const historySearch = search.trim().toLowerCase().split(/\s+/).slice(0, 16).join(" ");
  const historyType =
    category === "feature"
      ? "feature"
      : category === "fix"
        ? "fix"
        : category === "improvement"
          ? "improvement"
          : undefined;
  const historyFromDate = releaseDateBoundary(fromDate);
  const historyToDate = releaseDateBoundary(toDate, true);
  const data = useQuery(
    api.platform.changelog.queries.getWhatsNewFeed,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );
  const {
    results: historyResults,
    status: historyStatus,
    loadMore: loadMoreHistory,
  } = usePaginatedQuery(
    api.platform.changelog.queries.getWhatsNewHistory,
    sessionToken && !activeVersion
      ? {
          sessionToken,
          ...(historySearch ? { search: historySearch } : {}),
          ...(historyType ? { type: historyType } : {}),
          ...(historyFromDate === undefined ? {} : { fromDate: historyFromDate }),
          ...(historyToDate === undefined ? {} : { toDate: historyToDate }),
        }
      : "skip",
    { initialNumItems: 50 }
  );
  const linkedHistoryEntry = useQuery(
    api.platform.changelog.queries.getWhatsNewHistoryEntry,
    {
      sessionToken: sessionToken ?? "",
      entryId: linkedHistoryId as any,
    },
    !!sessionToken && !!linkedHistoryId && !activeVersion
  );
  const unreadCountResult = useQuery(
    api.platform.changelog.queries.getWhatsNewUnreadCount,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );
  const unreadCount = getSafeCount(unreadCountResult);
  const markAllRead = useMutation(api.platform.changelog.mutations.markAllRead);
  const scopeKey =
    sessionToken && data ? `${sessionToken}:${data.workspaceId}:${version ?? "all"}` : null;

  useEffect(() => {
    if (!sessionToken || !data || !scopeKey || openedScopeRef.current === scopeKey) return;
    openedScopeRef.current = scopeKey;
    void markAllRead({ sessionToken, ...(version ? { version } : {}) }).catch((error: unknown) =>
      console.error("Unable to update What's new read state", error)
    );
  }, [data, markAllRead, scopeKey, sessionToken, version]);

  const releaseEntries = (data?.entries ?? EMPTY_ENTRIES) as Entry[];
  const historyEntries = (historyResults ?? EMPTY_ENTRIES) as Entry[];
  const historyIsLoading =
    !!sessionToken &&
    !activeVersion &&
    (historyStatus === "LoadingFirstPage" || historyStatus === "LoadingMore");
  const entries = useMemo(() => {
    const byId = new Map<string, Entry>();
    for (const entry of [...releaseEntries, ...historyEntries]) byId.set(entry._id, entry);
    if (
      linkedHistoryEntry &&
      category === "all" &&
      !search.trim() &&
      !fromDate &&
      !toDate &&
      !personalized
    ) {
      byId.set(linkedHistoryEntry._id, linkedHistoryEntry as Entry);
    }
    return [...byId.values()].sort((a, b) => b.date - a.date);
  }, [
    category,
    fromDate,
    historyEntries,
    linkedHistoryEntry,
    personalized,
    releaseEntries,
    search,
    toDate,
  ]);
  useEffect(() => {
    if (!data || !window.location.hash) return;
    const hash = window.location.hash;
    if (lastScrolledHashRef.current === hash) return;
    let targetId: string;
    try {
      targetId = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;
      target.scrollIntoView({ block: "start" });
      lastScrolledHashRef.current = hash;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data, entries]);

  const supportHref = pathname.startsWith("/platform") ? "/platform/support" : "/support/tickets";
  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (activeVersion && (!entry.isRelease || entry.version !== activeVersion)) return false;
        if (category === "feature" && entry.type !== "feature") return false;
        if (category === "improvement" && entry.type !== "improvement" && entry.type !== "breaking")
          return false;
        if (category === "fix" && entry.type !== "fix") return false;
        if (personalized && entry.module && !installedModules.includes(entry.module)) return false;
        const fromBoundary = releaseDateBoundary(fromDate);
        const toBoundary = releaseDateBoundary(toDate, true);
        if (fromBoundary !== undefined && entry.date < fromBoundary) return false;
        if (toBoundary !== undefined && entry.date > toBoundary) return false;
        const needle = entry.isRelease ? search.trim().toLowerCase() : "";
        return (
          !needle ||
          [entry.title, entry.description, entry.version, entry.module, ...entry.tags].some(
            (value) => value?.toLowerCase().includes(needle)
          )
        );
      }),
    [activeVersion, category, entries, fromDate, installedModules, personalized, search, toDate]
  );
  const releases = useMemo(() => {
    const grouped = new Map<string, Entry[]>();
    for (const entry of filtered) {
      grouped.set(entry.groupKey, [...(grouped.get(entry.groupKey) ?? []), entry]);
    }
    return [...grouped].map(([groupKey, groupEntries]) => ({
      groupKey,
      isRelease: groupEntries[0]?.isRelease ?? false,
      version: groupEntries[0]?.version ?? "",
      date: Math.max(...groupEntries.map((entry) => entry.date)),
      entries: groupEntries,
    }));
  }, [filtered]);

  async function copyEntryLink(entry: Entry) {
    try {
      await navigator.clipboard.writeText(getEntryUrl(routeBase, entry));
      toast.success("Update link copied.");
    } catch {
      toast.error("Could not copy the update link.");
    }
  }

  function shareOnWhatsApp(entry: Entry) {
    const url = new URL("https://wa.me/");
    url.searchParams.set("text", `${entry.title} — ${getEntryUrl(routeBase, entry)}`);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
        <div className="h-10 w-56 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 border-b border-border pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                What&apos;s <span className="text-primary">new.</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Product updates, fixes, and improvements from the EduMyles team.
              </p>
            </div>
            {!activeVersion && (
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href={supportHref}>
                    <Lightbulb className="mr-2 h-4 w-4" /> Request a feature
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href={supportHref}>
                    <Bug className="mr-2 h-4 w-4" /> Report a bug
                  </Link>
                </Button>
              </div>
            )}
          </div>
          {activeVersion && (
            <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0">
              <Link href={routeBase}>All releases</Link>
            </Button>
          )}
        </header>

        {!activeVersion && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Filter product updates"
              className="inline-flex rounded-xl border border-border bg-muted/60 p-1"
            >
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={category === filter.id}
                  onClick={() => setCategory(filter.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    category === filter.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex min-w-[min(100%,18rem)] flex-1 items-center justify-end gap-2 sm:flex-none">
              {!!unreadCount && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  {unreadCount} new
                </Badge>
              )}
              <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-full pl-9"
                  aria-label="Search product updates"
                  placeholder="Search updates"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant={showFilters ? "secondary" : "outline"}
                size="icon"
                className="h-9 w-9 flex-none rounded-full"
                aria-label="Toggle additional filters"
                aria-expanded={showFilters}
                onClick={() => setShowFilters((current) => !current)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
            {showFilters && (
              <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-card p-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={personalized}
                    onChange={(event) => setPersonalized(event.target.checked)}
                  />
                  What changed for me?
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  From
                  <input
                    aria-label="From date"
                    type="date"
                    className="h-8 rounded-md border border-input bg-background px-2"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  To
                  <input
                    aria-label="To date"
                    type="date"
                    className="h-8 rounded-md border border-input bg-background px-2"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {releases.length === 0 ? (
          <Card className="border-border bg-card shadow-sm">
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {historyIsLoading
                  ? "Loading updates…"
                  : historyStatus === "CanLoadMore"
                    ? "More updates are available"
                    : entries.length === 0
                      ? "No updates published yet"
                      : "No updates found"}
              </h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {historyIsLoading
                  ? "Your timeline is updating while you search."
                  : historyStatus === "CanLoadMore"
                    ? "Load more updates to continue browsing this timeline."
                    : entries.length === 0
                      ? "When a release is published, its updates will appear here."
                      : "Try a different search or filter to find a published update."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="relative">
            {releases.map((release, index) => (
              <section
                key={release.groupKey}
                aria-label={release.isRelease ? `Release ${release.version}` : "Product update"}
                className="grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] gap-3 pb-5 sm:grid-cols-[6rem_1.5rem_minmax(0,1fr)] sm:gap-4"
              >
                <time className="pt-4 text-right text-xs font-medium leading-4 text-muted-foreground sm:text-sm">
                  {formatReleaseDate(release.date)}
                </time>
                <div className="relative flex justify-center">
                  {index < releases.length - 1 && (
                    <span
                      className="absolute bottom-[-1.25rem] top-0 w-px bg-border"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative mt-5 h-3 w-3 rounded-full border-2 border-background bg-primary ring-1 ring-primary/30" />
                </div>
                <div className="min-w-0 space-y-3">
                  {release.entries.map((entry) => {
                    return (
                      <Card
                        key={entry._id}
                        id={`update-${entry._id}`}
                        className="scroll-mt-24 overflow-hidden rounded-xl border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full bg-primary px-2.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary">
                              {release.isRelease ? "Release" : "Update"}
                            </Badge>
                            {release.isRelease && (
                              <span className="font-semibold text-foreground">
                                Release {release.version}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {CATEGORY_LABEL[entry.type]}
                            </span>
                            {entry.module && (
                              <Badge variant="outline" className="font-normal">
                                {entry.module}
                              </Badge>
                            )}
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="font-normal">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <h2 className="mt-2 text-base font-semibold leading-6 text-foreground sm:text-lg">
                            {entry.title}
                          </h2>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {entry.description}
                          </p>
                          {entry.links?.length ? (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {entry.links.map((link) => (
                                <Link
                                  key={`${entry._id}-${link.url}`}
                                  href={link.url}
                                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                >
                                  {link.label}
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                              ))}
                            </div>
                          ) : null}
                          <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                            <span className="mr-1">Share</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full px-3"
                              onClick={() => void copyEntryLink(entry)}
                            >
                              <Link2 className="mr-1.5 h-3.5 w-3.5" /> Copy link
                            </Button>
                            <button
                              type="button"
                              onClick={() => shareOnWhatsApp(entry)}
                              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                            >
                              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                              <ArrowUpRight className="ml-1 h-3 w-3" />
                            </button>
                          </footer>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        {(historyStatus === "CanLoadMore" || historyStatus === "LoadingMore") && (
          <div className="mt-3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={historyStatus === "LoadingMore"}
              onClick={() => loadMoreHistory(50)}
            >
              {historyStatus === "LoadingMore" ? "Loading updates…" : "Load more updates"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
