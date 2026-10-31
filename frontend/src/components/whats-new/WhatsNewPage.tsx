"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckCheck,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Entry = {
  _id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  module?: string;
  tags: string[];
  date: number;
  links?: Array<{ label: string; url: string }>;
};

const categories = ["all", "feature", "improvement", "fix", "breaking"];
const EMPTY_ENTRIES: Entry[] = [];
const categoryLabel: Record<string, string> = {
  feature: "Feature",
  improvement: "Improvement",
  fix: "Fix",
  breaking: "Breaking change",
};

export function WhatsNewPage({ version }: { version?: string }) {
  const pathname = usePathname() ?? "/admin/whats-new";
  const releasePathIndex = pathname.indexOf("/releases/");
  const routeBase =
    releasePathIndex >= 0 ? pathname.slice(0, releasePathIndex) : pathname.replace(/\/$/, "");
  const { sessionToken } = useAuth();
  const { installedModules } = useInstalledModules();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [personalized, setPersonalized] = useState(false);
  const openedScopeRef = useRef<string | null>(null);
  const data = useQuery(
    api.platform.changelog.queries.getWhatsNewFeed,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );
  const unreadCount = useQuery(
    api.platform.changelog.queries.getWhatsNewUnreadCount,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );
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

  const entries = (data?.entries ?? EMPTY_ENTRIES) as Entry[];
  const activeVersion = version;
  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (activeVersion && entry.version !== decodeURIComponent(activeVersion)) return false;
        if (category !== "all" && entry.type !== category) return false;
        if (personalized && entry.module && !installedModules.includes(entry.module)) return false;
        if (fromDate && entry.date < new Date(`${fromDate}T00:00:00`).getTime()) return false;
        if (toDate && entry.date > new Date(`${toDate}T23:59:59`).getTime()) return false;
        const needle = search.trim().toLowerCase();
        return (
          !needle ||
          [
            entry.title,
            entry.description,
            entry.version,
            entry.module,
            ...entry.tags,
          ].some((value) => value?.toLowerCase().includes(needle))
        );
      }),
    [activeVersion, category, entries, fromDate, installedModules, personalized, search, toDate]
  );
  const releases = useMemo(() => {
    const grouped = new Map<string, Entry[]>();
    for (const entry of filtered)
      grouped.set(entry.version, [...(grouped.get(entry.version) ?? []), entry]);
    return [...grouped].map(([releaseVersion, releaseEntries]) => ({
      version: releaseVersion,
      entries: releaseEntries,
    }));
  }, [filtered]);

  if (!data)
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-4 p-6">
        <div className="h-10 w-56 rounded bg-muted" />
        <div className="h-44 rounded-xl bg-muted" />
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold">Product updates</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {activeVersion ? `Release ${decodeURIComponent(activeVersion)}` : "What’s new"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Features, improvements, and fixes for your panel, organized by release.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!!unreadCount && <Badge>{unreadCount} new</Badge>}
          {activeVersion && (
            <Button asChild variant="outline" size="sm">
              <Link href={routeBase}>All releases</Link>
            </Button>
          )}
        </div>
      </header>

      {!activeVersion && (
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search updates"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-10 rounded-md border border-input bg-background px-3"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "All categories" : categoryLabel[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={personalized}
                onChange={(event) => setPersonalized(event.target.checked)}
              />
              What changed for me?
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <input
                aria-label="From date"
                type="date"
                className="h-9 rounded-md border border-input bg-background px-2"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
              <span>to</span>
              <input
                aria-label="To date"
                type="date"
                className="h-9 rounded-md border border-input bg-background px-2"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
            {data.unreadCount > 0 && (
              <Button
                className="md:col-span-4 md:justify-self-end"
                size="sm"
                variant="ghost"
                onClick={() => sessionToken && markAllRead({ sessionToken })}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {releases.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 text-lg font-medium">No updates found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another search or filter. New updates for this panel will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        releases.map((release) => (
          <section
            key={release.version}
            className="grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[6rem_1.5rem_minmax(0,1fr)] sm:gap-4"
          >
            <time className="pt-5 text-right text-xs leading-4 text-muted-foreground">
              {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                new Date(Math.max(...release.entries.map((entry) => entry.date)))
              )}
            </time>
            <div className="relative flex justify-center">
              {release !== releases[releases.length - 1] && (
                <span
                  className="absolute bottom-[-1.5rem] top-0 w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <span className="relative mt-6 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary ring-1 ring-border" />
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3 border-b pb-3">
                <Badge variant="outline">Release</Badge>
                <h2 className="text-xl font-semibold">Version {release.version}</h2>
                <Button asChild variant="link" size="sm" className="ml-auto">
                  <Link href={`${routeBase}/releases/${encodeURIComponent(release.version)}`}>
                    Release details
                  </Link>
                </Button>
              </div>
              {release.entries.map((entry) => (
                <Card key={entry._id} className="overflow-hidden">
                  <CardContent className="flex gap-4 p-5">
                    <span
                      className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{entry.title}</h3>
                        <Badge variant="secondary">{categoryLabel[entry.type] ?? entry.type}</Badge>
                        {entry.module && <Badge variant="outline">{entry.module}</Badge>}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {entry.description}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {entry.links?.length ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {entry.links.map((link) => (
                            <a
                              key={link.url}
                              href={link.url}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                              {link.label}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
