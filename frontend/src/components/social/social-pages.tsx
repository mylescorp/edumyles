"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Clock3,
  EyeOff,
  MessageSquare,
  Plus,
  Send,
  Share2,
  Sparkles,
  Trash2,
  UserRoundCheck,
  Wand2,
} from "lucide-react";
import {
  buildPlatformBreakdown,
  buildSocialTrend,
  buildTwitterThreadParts,
  formatCalendarDateKey,
  getCalendarRange,
  getPlatformCharacterLimit,
  groupPostsByCalendarDay,
  sameCalendarDay,
} from "./social-utils";

type SocialScope = "tenant" | "platform" | "teacher";

type BestTimeSuggestion = {
  day: string;
  hour: number;
  reason: string;
};

const PLATFORM_COLORS = ["#2563eb", "#f97316", "#16a34a", "#7c3aed", "#dc2626", "#0891b2", "#ca8a04", "#0f766e"];
const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function buildArgs(sessionToken?: string | null, scope: SocialScope = "tenant") {
  return {
    sessionToken: sessionToken ?? "",
    isPlatformContext: scope === "platform" ? true : undefined,
  };
}

function socialBasePath(scope: SocialScope) {
  if (scope === "platform") return "/platform/social";
  if (scope === "teacher") return "/portal/teacher/social";
  return "/admin/social";
}

function breadcrumbsFor(scope: SocialScope, current: string) {
  if (scope === "platform") {
    return [
      { label: "Platform", href: "/platform" },
      { label: "Social", href: "/platform/social" },
      { label: current },
    ];
  }

  if (scope === "teacher") {
    return [
      { label: "Teacher Portal", href: "/portal/teacher" },
      { label: "Social", href: "/portal/teacher/social/create" },
      { label: current },
    ];
  }

  return [
    { label: "Admin", href: "/admin" },
    { label: "Social", href: "/admin/social" },
    { label: current },
  ];
}

function formatDateTime(value?: number | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

function formatDateTimeInput(value?: number | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function statusTone(status?: string) {
  switch (status) {
    case "published":
      return "default";
    case "scheduled":
    case "approved":
      return "secondary";
    case "failed":
    case "rejected":
    case "token_expired":
      return "destructive";
    default:
      return "outline";
  }
}

function nextSuggestedDate(day: string, hour: number) {
  const targetDay = WEEKDAY_INDEX[day] ?? 2;
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(hour, 0, 0, 0);
  const distance = (targetDay - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + (distance === 0 && next.getTime() <= now.getTime() ? 7 : distance));
  return next;
}

function platformPermission(permission: string, scope: SocialScope) {
  return scope === "platform" ? permission : null;
}

function SocialEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted p-3">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

function SocialAccessDenied({ scope, permission }: { scope: SocialScope; permission: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={scope === "platform" ? "Platform Social" : "Social Media"}
        description="This workspace is permission-aware and only unlocks the sections assigned to your role."
        breadcrumbs={breadcrumbsFor(scope, "Access")}
      />
      <Card className="border-amber-200 bg-amber-50/70">
        <CardContent className="flex items-start gap-3 py-8">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="space-y-1">
            <p className="font-medium text-amber-900">Access required</p>
            <p className="text-sm text-amber-800">
              Your account does not currently include <code>{permission}</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SocialNav({ scope }: { scope: SocialScope }) {
  const basePath = socialBasePath(scope);
  const items =
    scope === "teacher"
      ? [
          { href: `${basePath}/create`, label: "Create Draft" },
          { href: `${basePath}/status`, label: "My Drafts" },
        ]
      : [
          { href: basePath, label: "Dashboard" },
          { href: `${basePath}/posts`, label: "Posts" },
          { href: `${basePath}/posts/create`, label: "Composer" },
          { href: `${basePath}/accounts`, label: "Accounts" },
          { href: `${basePath}/analytics`, label: "Analytics" },
          { href: `${basePath}/comments`, label: "Comments" },
          { href: `${basePath}/calendar`, label: "Calendar" },
        ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button variant="outline" size="sm">
            {item.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
      </CardContent>
    </Card>
  );
}

function usePlatformPageAccess(scope: SocialScope, permission: string) {
  const { can, isLoaded } = usePlatformPermissions();
  if (scope !== "platform") {
    return { isReady: true, allowed: true };
  }
  if (!isLoaded) {
    return { isReady: false, allowed: false };
  }
  return { isReady: true, allowed: can(permission) };
}

export function SocialDashboardPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.view", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.view");
  const { sessionToken, isLoading } = useAuth();
  const queryArgs = buildArgs(sessionToken, scope);
  const canQuery = Boolean(sessionToken && (!requiredPermission || access.allowed));
  const posts = useQuery(api.modules.social.posts.getPosts, canQuery ? queryArgs : "skip") as any[] | undefined;
  const accounts = useQuery(
    api.modules.social.oauth.getConnectedAccounts,
    canQuery ? queryArgs : "skip"
  ) as any[] | undefined;
  const analytics = useQuery(api.modules.social.analytics.getAnalytics, canQuery ? queryArgs : "skip") as any;

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || posts === undefined || accounts === undefined || analytics === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const safePosts = asArray<any>(posts);
  const safeAccounts = asArray<any>(accounts);
  const pending = safePosts.filter((post) => post.status === "pending_approval").length;
  const published = safePosts.filter((post) => post.status === "published").length;
  const failed = safePosts.filter((post) => post.status === "failed").length;
  const trend = buildSocialTrend(asArray<any>(analytics.rows).slice(0, 14).reverse());

  return (
    <div className="space-y-6">
      <PageHeader
        title={scope === "platform" ? "Platform Social" : "Social Media"}
        description="Connected accounts, approval flow, publishing, comments, and analytics in one operating panel."
        breadcrumbs={breadcrumbsFor(scope, "Dashboard")}
        actions={
          <Link href={`${socialBasePath(scope)}/posts/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        }
      />
      <SocialNav scope={scope} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Connected Accounts" value={safeAccounts.length} icon={<UserRoundCheck className="h-4 w-4" />} />
        <StatCard title="Pending Approval" value={pending} icon={<Clock3 className="h-4 w-4" />} />
        <StatCard title="Published Posts" value={published} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard title="Failed Posts" value={failed} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Reach Trend</CardTitle>
            <CardDescription>Last 14 data points from the analytics pull for this social workspace.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {trend.length === 0 ? (
              <SocialEmptyState title="No analytics yet" description="Publish a few posts or sync analytics to populate the trend chart." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="reach" stroke="#2563eb" fill="url(#reachGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Health Snapshot</CardTitle>
            <CardDescription>A quick sense of what needs attention right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">30d Reach</p>
              <p className="text-2xl font-semibold">{formatNumber(analytics.summary?.reach)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">30d Engagements</p>
              <p className="text-2xl font-semibold">{formatNumber(analytics.summary?.engagements)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Follower Growth</p>
              <p className="text-2xl font-semibold">{formatNumber(analytics.summary?.followers)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>The latest drafts, approvals, schedules, and publish outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {safePosts.length === 0 ? (
              <SocialEmptyState
                title="No social posts yet"
                description="Create your first draft to start the workflow."
                action={
                  <Link href={`${socialBasePath(scope)}/posts/create`}>
                    <Button size="sm">Open Composer</Button>
                  </Link>
                }
              />
            ) : (
              safePosts.slice(0, 6).map((post) => (
                <Link key={post._id} href={`${socialBasePath(scope)}/posts/${post._id}`}>
                  <div className="rounded-lg border p-3 transition-colors hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {(post.platformVariants ?? []).map((variant: any) => variant.platform).join(", ") || "No platforms"}
                        </p>
                      </div>
                      <Badge variant={statusTone(post.status)}>{post.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Connected Platforms</CardTitle>
            <CardDescription>Live account status across the channels in this scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeAccounts.length === 0 ? (
              <SocialEmptyState
                title="No accounts connected"
                description="Connect Facebook, Instagram, X, LinkedIn, YouTube, TikTok, WhatsApp, or Telegram to publish from here."
                action={
                  <Link href={`${socialBasePath(scope)}/accounts`}>
                    <Button size="sm" variant="outline">
                      Manage Accounts
                    </Button>
                  </Link>
                }
              />
            ) : (
              safeAccounts.slice(0, 8).map((account) => (
                <div key={account._id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{account.platform}</p>
                      <p className="text-xs text-muted-foreground">{account.accountName}</p>
                    </div>
                    <Badge variant={statusTone(account.status)}>{account.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SocialAccountsPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.manage_accounts", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.manage_accounts");
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const args = buildArgs(sessionToken, scope);
  const canQuery = Boolean(sessionToken && (!requiredPermission || access.allowed));
  const accounts = useQuery(
    api.modules.social.oauth.getConnectedAccounts,
    canQuery ? args : "skip"
  ) as any[] | undefined;
  const disconnect = useMutation(api.modules.social.oauth.disconnectAccount);
  const connectWhatsApp = useMutation(api.modules.social.oauth.connectWhatsApp);
  const connectTelegram = useMutation(api.modules.social.oauth.connectTelegram);
  const [whatsAppForm, setWhatsAppForm] = useState({
    accountName: "",
    accountHandle: "",
    wabaId: "",
    phoneNumberId: "",
    systemUserToken: "",
  });
  const [telegramForm, setTelegramForm] = useState({ accountName: "", channelUsername: "", botToken: "" });

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || accounts === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const safeAccounts = asArray<any>(accounts);

  const handleDisconnect = async (accountDocId: string) => {
    await disconnect({ ...args, accountDocId: accountDocId as any });
    toast({ title: "Disconnected", description: "The account has been disconnected." });
  };

  const handleWhatsApp = async () => {
    await connectWhatsApp({ ...args, ...whatsAppForm });
    toast({ title: "WhatsApp connected", description: "The WhatsApp Business account is now available." });
  };

  const handleTelegram = async () => {
    await connectTelegram({ ...args, ...telegramForm });
    toast({ title: "Telegram connected", description: "The Telegram channel is now available." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connected Accounts"
        description="Manage OAuth and token-based account connections with encrypted credential storage."
        breadcrumbs={breadcrumbsFor(scope, "Accounts")}
      />
      <SocialNav scope={scope} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Platforms</CardTitle>
            <CardDescription>Guided setup for Facebook, Instagram, X, LinkedIn, YouTube, and TikTok.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok"].map((platform) => (
              <Link key={platform} href={`${socialBasePath(scope)}/accounts/connect/${platform}`}>
                <Button variant="outline" className="w-full justify-start capitalize">
                  Connect {platform}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manual Platforms</CardTitle>
            <CardDescription>Connect WhatsApp Business and Telegram with verified token entry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>WhatsApp Business</Label>
              <Input placeholder="Account name" value={whatsAppForm.accountName} onChange={(event) => setWhatsAppForm((current) => ({ ...current, accountName: event.target.value }))} />
              <Input placeholder="Handle (optional)" value={whatsAppForm.accountHandle} onChange={(event) => setWhatsAppForm((current) => ({ ...current, accountHandle: event.target.value }))} />
              <Input placeholder="WABA ID" value={whatsAppForm.wabaId} onChange={(event) => setWhatsAppForm((current) => ({ ...current, wabaId: event.target.value }))} />
              <Input placeholder="Phone Number ID" value={whatsAppForm.phoneNumberId} onChange={(event) => setWhatsAppForm((current) => ({ ...current, phoneNumberId: event.target.value }))} />
              <Textarea placeholder="System User Token" value={whatsAppForm.systemUserToken} onChange={(event) => setWhatsAppForm((current) => ({ ...current, systemUserToken: event.target.value }))} />
              <Button onClick={handleWhatsApp}>Verify & Connect WhatsApp</Button>
            </div>
            <div className="space-y-2">
              <Label>Telegram Channel</Label>
              <Input placeholder="Account name" value={telegramForm.accountName} onChange={(event) => setTelegramForm((current) => ({ ...current, accountName: event.target.value }))} />
              <Input placeholder="@channel_username" value={telegramForm.channelUsername} onChange={(event) => setTelegramForm((current) => ({ ...current, channelUsername: event.target.value }))} />
              <Textarea placeholder="Bot token" value={telegramForm.botToken} onChange={(event) => setTelegramForm((current) => ({ ...current, botToken: event.target.value }))} />
              <Button onClick={handleTelegram}>Verify & Connect Telegram</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Existing Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {safeAccounts.length === 0 ? (
            <SocialEmptyState title="No accounts connected" description="Start with an OAuth platform or connect WhatsApp/Telegram manually." />
          ) : (
            safeAccounts.map((account) => (
              <div key={account._id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium capitalize">{account.platform}</p>
                  <p className="text-sm text-muted-foreground">{account.accountName}</p>
                  <p className="text-xs text-muted-foreground">Last sync: {formatDateTime(account.lastSyncAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusTone(account.status)}>{account.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleDisconnect(String(account._id))}>
                    Disconnect
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SocialConnectPlatformPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.manage_accounts", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.manage_accounts");
  const { platform } = useParams<{ platform: string }>();
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const oauthUrl = useQuery(
    api.modules.social.oauth.getOAuthUrl,
    sessionToken && (!requiredPermission || access.allowed)
      ? { ...buildArgs(sessionToken, scope), platform: platform as any }
      : "skip"
  ) as any;

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || oauthUrl === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const callbackBase = socialBasePath(scope);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Connect ${platform}`}
        description="Authorize EduMyles to manage publishing, analytics, and comment workflows for this account."
        breadcrumbs={breadcrumbsFor(scope, `Connect ${platform}`)}
      />
      <SocialNav scope={scope} />
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{platform} Setup</CardTitle>
          <CardDescription>Complete the platform authorization, then you will return here automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p>Callback route: <code>{`${callbackBase}/accounts/oauth-callback`}</code></p>
            <p>State token prepared for this request: <code>{oauthUrl.state}</code></p>
          </div>
          {oauthUrl.url ? (
            <a href={oauthUrl.url} target="_self">
              <Button className="capitalize">Connect with {platform}</Button>
            </a>
          ) : (
            <Button
              disabled
              onClick={() =>
                toast({
                  title: "Manual Setup",
                  description: "This platform uses token-based setup from the Accounts page.",
                })
              }
            >
              Manual Setup Required
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SocialOAuthCallbackPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.manage_accounts", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.manage_accounts");
  const { sessionToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const completeOAuthConnection = useAction(
    (api as any).modules?.social?.oauth?.completeOAuthConnection ??
      (api as any)["modules/social/oauth"]?.completeOAuthConnection
  );
  const [status, setStatus] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    if (scope === "platform" && access.isReady && !access.allowed) {
      setStatus("error");
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const platform = searchParams.get("platform") ?? searchParams.get("provider");
    if (!sessionToken || !code || !state || !platform) {
      setStatus("error");
      return;
    }

    completeOAuthConnection({
      sessionToken,
      isPlatformContext: scope === "platform" ? true : undefined,
      platform: platform as any,
      code,
      state,
      redirectUri: `${window.location.origin}${socialBasePath(scope)}/accounts/oauth-callback`,
    })
      .then(() => {
        setStatus("done");
        toast({ title: "Account connected", description: "The social account is now ready to use." });
        router.push(`${socialBasePath(scope)}/accounts`);
      })
      .catch((error: unknown) => {
        setStatus("error");
        toast({
          title: "Connection failed",
          description: error instanceof Error ? error.message : "OAuth callback failed.",
          variant: "destructive",
        });
      });
  }, [access.allowed, access.isReady, completeOAuthConnection, router, scope, searchParams, sessionToken, toast]);

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="OAuth Callback" description="Finalizing your social account connection." breadcrumbs={breadcrumbsFor(scope, "OAuth Callback")} />
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground">
            {status === "working" && "Completing the connection..."}
            {status === "done" && "Connected successfully. Redirecting..."}
            {status === "error" && "The connection could not be completed. Please return and try again."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function SocialPostsPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.view", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.view");
  const { sessionToken, isLoading } = useAuth();
  const posts = useQuery(
    api.modules.social.posts.getPosts,
    sessionToken && (!requiredPermission || access.allowed) ? buildArgs(sessionToken, scope) : "skip"
  ) as any[] | undefined;
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || posts === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const safePosts = asArray<any>(posts);
  const filteredPosts = safePosts.filter((post) => {
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesPlatform =
      platformFilter === "all" ||
      (post.platformVariants ?? []).some((variant: any) => variant.platform === platformFilter);
    const haystack = `${post.title} ${(post.tags ?? []).join(" ")}`.toLowerCase();
    const matchesSearch = search.trim() === "" || haystack.includes(search.toLowerCase());
    return matchesStatus && matchesPlatform && matchesSearch;
  });

  const platforms = Array.from(
    new Set(safePosts.flatMap((post) => (post.platformVariants ?? []).map((variant: any) => variant.platform)))
  );

  return (
    <div className="space-y-6">
      <PageHeader title="All Posts" description="Filter drafts, approvals, schedules, and publish outcomes." breadcrumbs={breadcrumbsFor(scope, "Posts")} />
      <SocialNav scope={scope} />
      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or tags" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["draft", "pending_approval", "approved", "scheduled", "published", "failed", "rejected", "cancelled"].map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-6">
          {filteredPosts.length === 0 ? (
            <SocialEmptyState
              title="No posts match these filters"
              description="Adjust the filters or create a new post to populate the queue."
            />
          ) : (
            filteredPosts.map((post) => (
              <Link key={post._id} href={`${socialBasePath(scope)}/posts/${post._id}`}>
                <div className="rounded-lg border p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(post.platformVariants ?? []).map((variant: any) => variant.platform).join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Scheduled: {formatDateTime(post.scheduledAt ?? post.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusTone(post.status)}>{post.status}</Badge>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SocialPostDetailPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.view", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.view");
  const params = useParams<{ postId: string }>();
  const { sessionToken, isLoading } = useAuth();
  const { can } = usePlatformPermissions();
  const { toast } = useToast();
  const post = useQuery(
    api.modules.social.posts.getPost,
    sessionToken && (!requiredPermission || access.allowed)
      ? { ...buildArgs(sessionToken, scope), postId: params.postId as any }
      : "skip"
  ) as any;
  const approvePost = useMutation(api.modules.social.posts.approvePost);
  const rejectPost = useMutation(api.modules.social.posts.rejectPost);
  const cancelPost = useMutation(api.modules.social.posts.cancelPost);

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || post === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const canApprove = scope !== "platform" || can("social.approve");

  return (
    <div className="space-y-6">
      <PageHeader
        title={post.title}
        description="Review platform variants, analytics rows, and comment activity before you publish."
        breadcrumbs={breadcrumbsFor(scope, "Post Detail")}
        actions={
          <Link href={`${socialBasePath(scope)}/posts/${params.postId}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        }
      />
      <SocialNav scope={scope} />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Platform Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(post.platformVariants ?? []).map((variant: any) => (
              <div key={`${variant.platform}-${variant.accountId}`} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">
                    {variant.platform}
                  </Badge>
                  <Badge variant={statusTone(variant.publishStatus ?? post.status)}>
                    {variant.publishStatus ?? post.status}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm">{variant.textContent || "No text content"}</p>
                {variant.mediaUrls?.length ? (
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {variant.mediaUrls.map((mediaUrl: string) => (
                      <p key={mediaUrl} className="truncate">
                        {mediaUrl}
                      </p>
                    ))}
                  </div>
                ) : null}
                {variant.publishedPostUrl ? (
                  <a className="mt-3 inline-block text-sm text-blue-600 underline" href={variant.publishedPostUrl} target="_blank" rel="noreferrer">
                    Open published post
                  </a>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Status: <strong>{post.status}</strong>
            </p>
            <p className="text-sm">
              Approval required: <strong>{post.approvalRequired ? "Yes" : "No"}</strong>
            </p>
            <p className="text-sm">
              Scheduled at: <strong>{formatDateTime(post.scheduledAt)}</strong>
            </p>
            {canApprove ? (
              <>
                <Button
                  className="w-full"
                  onClick={async () => {
                    await approvePost({ ...buildArgs(sessionToken, scope), postId: params.postId as any });
                    toast({ title: "Approved", description: "The post is approved and will publish when ready." });
                  }}
                >
                  Approve / Queue Publish
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    await rejectPost({
                      ...buildArgs(sessionToken, scope),
                      postId: params.postId as any,
                      reason: "Rejected from detail view.",
                    });
                    toast({ title: "Rejected", description: "The post was rejected." });
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await cancelPost({ ...buildArgs(sessionToken, scope), postId: params.postId as any });
                    toast({ title: "Cancelled", description: "The scheduled post has been cancelled." });
                  }}
                >
                  Cancel Post
                </Button>
              </>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
                Approval and publish actions are restricted to platform managers.
              </div>
            )}
            <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              <p>Analytics rows: {post.analytics?.length ?? 0}</p>
              <p>Comments synced: {post.comments?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type VariantMetaState = Record<
  string,
  {
    mediaType: string;
    linkUrl: string;
    linkTitle: string;
    linkDescription: string;
    pollOptions: string;
    pollDurationMinutes: string;
    youtubeTitle: string;
    youtubeDescription: string;
    youtubeTags: string;
    youtubeCategory: string;
    youtubePrivacy: string;
    tiktokCaption: string;
  }
>;

const EMPTY_VARIANT_META = {
  mediaType: "image",
  linkUrl: "",
  linkTitle: "",
  linkDescription: "",
  pollOptions: "",
  pollDurationMinutes: "1440",
  youtubeTitle: "",
  youtubeDescription: "",
  youtubeTags: "",
  youtubeCategory: "education",
  youtubePrivacy: "public",
  tiktokCaption: "",
};

export function SocialComposerPage({ scope, mode = "create" }: { scope: SocialScope; mode?: "create" | "edit" }) {
  const requiredPermission = platformPermission("social.create", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.create");
  const params = useParams<{ postId?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const args = buildArgs(sessionToken, scope);
  const canQuery = Boolean(sessionToken && (!requiredPermission || access.allowed));
  const accounts = useQuery(api.modules.social.oauth.getConnectedAccounts, canQuery ? args : "skip") as any[] | undefined;
  const existingPost = useQuery(
    api.modules.social.posts.getPost,
    canQuery && mode === "edit" && params.postId ? { ...args, postId: params.postId as any } : "skip"
  ) as any;
  const createPost = useMutation(api.modules.social.posts.createPost);
  const updatePost = useMutation(api.modules.social.posts.updatePost);
  const submitForApproval = useMutation(api.modules.social.posts.submitForApproval);
  const generateCaption = useAction(api.modules.social.ai.generateSocialCaption);
  const generateHashtags = useAction(api.modules.social.ai.generateHashtags);
  const suggestBestPostTime = useAction(api.modules.social.ai.suggestBestPostTime);

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [variantText, setVariantText] = useState<Record<string, string>>({});
  const [variantMedia, setVariantMedia] = useState<Record<string, string>>({});
  const [variantMeta, setVariantMeta] = useState<VariantMetaState>({});
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [bestTimeSuggestions, setBestTimeSuggestions] = useState<BestTimeSuggestion[]>([]);

  useEffect(() => {
    if (existingPost && mode === "edit") {
      setTitle(existingPost.title ?? "");
      setScheduledAt(formatDateTimeInput(existingPost.scheduledAt));
      setSelectedAccountIds((existingPost.targetAccountIds ?? []).map((id: any) => String(id)));
      const textMap: Record<string, string> = {};
      const mediaMap: Record<string, string> = {};
      const metaMap: VariantMetaState = {};
      for (const variant of existingPost.platformVariants ?? []) {
        const key = String(variant.accountId);
        textMap[key] = variant.textContent ?? "";
        mediaMap[key] = (variant.mediaUrls ?? []).join("\n");
        metaMap[key] = {
          mediaType: variant.mediaType ?? "image",
          linkUrl: variant.linkUrl ?? "",
          linkTitle: variant.linkTitle ?? "",
          linkDescription: variant.linkDescription ?? "",
          pollOptions: (variant.pollOptions ?? []).join(", "),
          pollDurationMinutes: String(variant.pollDurationMinutes ?? 1440),
          youtubeTitle: variant.youtubeTitle ?? "",
          youtubeDescription: variant.youtubeDescription ?? "",
          youtubeTags: (variant.youtubeTags ?? []).join(", "),
          youtubeCategory: variant.youtubeCategory ?? "education",
          youtubePrivacy: variant.youtubePrivacy ?? "public",
          tiktokCaption: variant.tiktokCaption ?? "",
        };
      }
      setVariantText(textMap);
      setVariantMedia(mediaMap);
      setVariantMeta(metaMap);
      setHashtags(existingPost.tags ?? []);
    }
  }, [existingPost, mode]);

  useEffect(() => {
    if (mode !== "create" || scope === "teacher") return;
    const dateParam = searchParams.get("date");
    if (!dateParam || scheduledAt) return;
    const next = new Date(`${dateParam}T09:00:00`);
    if (!Number.isNaN(next.getTime())) {
      setScheduledAt(formatDateTimeInput(next.getTime()));
    }
  }, [mode, scope, scheduledAt, searchParams]);

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || accounts === undefined || (mode === "edit" && existingPost === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  const safeAccounts = asArray<any>(accounts);
  const selectedAccounts = safeAccounts.filter((account) => selectedAccountIds.includes(String(account._id)));
  const primaryPlatform = selectedAccounts[0]?.platform ?? "facebook";

  const handleAccountToggle = (accountId: string, checked: boolean) => {
    setSelectedAccountIds((current) => (checked ? [...current, accountId] : current.filter((id) => id !== accountId)));
  };

  const setVariantMetaField = (accountId: string, field: keyof VariantMetaState[string], value: string) => {
    setVariantMeta((current) => ({
      ...current,
      [accountId]: {
        ...(current[accountId] ?? EMPTY_VARIANT_META),
        [field]: value,
      },
    }));
  };

  const platformVariants = selectedAccounts.map((account) => {
    const key = String(account._id);
    const meta = variantMeta[key] ?? EMPTY_VARIANT_META;
    const threadParts = buildTwitterThreadParts(variantText[key] ?? "");
    return {
      platform: account.platform,
      accountId: account._id,
      textContent: variantText[key] ?? "",
      mediaUrls: (variantMedia[key] ?? "")
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      mediaType: meta.mediaType,
      linkUrl: meta.linkUrl || undefined,
      linkTitle: meta.linkTitle || undefined,
      linkDescription: meta.linkDescription || undefined,
      tweetThreadParts: account.platform === "twitter" && threadParts.length > 1 ? threadParts : undefined,
      pollOptions:
        (account.platform === "twitter" || account.platform === "telegram") && meta.pollOptions.trim()
          ? meta.pollOptions.split(",").map((value) => value.trim()).filter(Boolean)
          : undefined,
      pollDurationMinutes:
        (account.platform === "twitter" || account.platform === "telegram") && meta.pollOptions.trim()
          ? Number(meta.pollDurationMinutes || "1440")
          : undefined,
      youtubeTitle: account.platform === "youtube" ? meta.youtubeTitle || title : undefined,
      youtubeDescription: account.platform === "youtube" ? meta.youtubeDescription || variantText[key] || "" : undefined,
      youtubeTags:
        account.platform === "youtube" && meta.youtubeTags.trim()
          ? meta.youtubeTags.split(",").map((value) => value.trim()).filter(Boolean)
          : undefined,
      youtubeCategory: account.platform === "youtube" ? meta.youtubeCategory : undefined,
      youtubePrivacy: account.platform === "youtube" ? meta.youtubePrivacy : undefined,
      tiktokCaption: account.platform === "tiktok" ? meta.tiktokCaption || variantText[key] || "" : undefined,
    };
  });

  const handleSave = async (submit = false) => {
    if (selectedAccounts.length === 0) {
      toast({ title: "Select accounts", description: "Choose at least one target account first.", variant: "destructive" });
      return;
    }

    const payload = {
      ...args,
      title,
      scheduledAt: scheduledAt ? new Date(scheduledAt).getTime() : undefined,
      approvalRequired: scope === "teacher" ? true : undefined,
      tags: hashtags,
      targetAccountIds: selectedAccounts.map((account) => account._id),
      platformVariants,
    };

    if (mode === "edit" && params.postId) {
      await updatePost({ ...payload, postId: params.postId as any });
      if (submit) {
        await submitForApproval({ ...args, postId: params.postId as any });
      }
      toast({ title: "Post updated", description: submit ? "The post was resubmitted for approval." : "Changes saved." });
      router.push(`${socialBasePath(scope)}/posts/${params.postId}`);
      return;
    }

    const created = await createPost(payload as any);
    if (submit) {
      await submitForApproval({ ...args, postId: created.postId });
    }
    toast({ title: "Post created", description: submit ? "The post was submitted for approval." : "Draft saved." });
    router.push(scope === "teacher" ? `${socialBasePath(scope)}/status` : `${socialBasePath(scope)}/posts/${created.postId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "edit" ? "Edit Post" : scope === "teacher" ? "Create Social Draft" : "Create Post"}
        description="Compose once, tailor per platform, and schedule with approval visibility built in."
        breadcrumbs={breadcrumbsFor(scope, mode === "edit" ? "Edit Post" : "Composer")}
      />
      <SocialNav scope={scope} />
      <div className="grid gap-6 xl:grid-cols-[1.05fr,1.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Targets & Workflow</CardTitle>
            <CardDescription>Select accounts, schedule, and review the approval posture before you send anything.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Internal Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sports Day Highlights" />
            </div>
            {scope !== "teacher" ? (
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                <p className="text-xs text-muted-foreground">Timezone defaults to Africa/Nairobi.</p>
              </div>
            ) : null}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Approval flow</p>
              <p className="mt-1 text-muted-foreground">
                {scope === "teacher"
                  ? "Teacher drafts always save first, then move into approval."
                  : "Admins and platform staff can save drafts, submit for approval, or approve and queue directly."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Connected Accounts</Label>
              {safeAccounts.length === 0 ? (
                <SocialEmptyState
                  title="No connected accounts"
                  description="Connect at least one platform before composing."
                  action={
                    <Link href={`${socialBasePath(scope)}/accounts`}>
                      <Button size="sm" variant="outline">
                        Open Accounts
                      </Button>
                    </Link>
                  }
                />
              ) : (
                safeAccounts.map((account) => (
                  <label key={account._id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Checkbox checked={selectedAccountIds.includes(String(account._id))} onCheckedChange={(checked) => handleAccountToggle(String(account._id), checked === true)} />
                    <div className="flex-1">
                      <p className="font-medium capitalize">{account.platform}</p>
                      <p className="text-xs text-muted-foreground">{account.accountName}</p>
                    </div>
                    <Badge variant={statusTone(account.status)}>{account.status}</Badge>
                  </label>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Composer</CardTitle>
            <CardDescription>Use shared drafting, AI helpers, platform-specific fields, and live limits before submitting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAccounts.length === 0 ? (
              <SocialEmptyState title="Select target accounts" description="Choose at least one connected account to start composing platform variants." />
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4 flex h-auto flex-wrap">
                  <TabsTrigger value="all">All Platforms</TabsTrigger>
                  {selectedAccounts.map((account) => (
                    <TabsTrigger key={account._id} value={String(account._id)} className="capitalize">
                      {account.platform}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Shared Draft</Label>
                    <Textarea
                      rows={6}
                      value={variantText[String(selectedAccounts[0]?._id)] ?? ""}
                      onChange={(event) => {
                        const nextText = event.target.value;
                        setVariantText(Object.fromEntries(selectedAccounts.map((account) => [String(account._id), nextText])));
                      }}
                      placeholder="Write the base caption or announcement."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const result = await generateCaption({
                          ...args,
                          platform: primaryPlatform as any,
                          prompt: variantText[String(selectedAccounts[0]?._id)] ?? title,
                        });
                        const caption = result.caption ?? "";
                        setVariantText(Object.fromEntries(selectedAccounts.map((account) => [String(account._id), caption])));
                      }}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      AI Caption
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const result = await generateHashtags({
                          ...args,
                          prompt: variantText[String(selectedAccounts[0]?._id)] ?? title,
                        });
                        setHashtags(result.hashtags ?? []);
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Hashtags
                    </Button>
                    {scope !== "teacher" ? (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const result = await suggestBestPostTime({
                            ...args,
                            platform: primaryPlatform as any,
                          });
                          setBestTimeSuggestions(asArray<BestTimeSuggestion>(result.suggestions));
                        }}
                      >
                        <Clock3 className="mr-2 h-4 w-4" />
                        Best Times
                      </Button>
                    ) : null}
                  </div>
                  {hashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {bestTimeSuggestions.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      {bestTimeSuggestions.map((suggestion) => (
                        <button
                          type="button"
                          key={`${suggestion.day}-${suggestion.hour}`}
                          onClick={() => setScheduledAt(formatDateTimeInput(nextSuggestedDate(suggestion.day, suggestion.hour).getTime()))}
                          className="rounded-lg border p-3 text-left transition hover:border-primary hover:bg-muted/40"
                        >
                          <p className="font-medium">{suggestion.day}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.hour}:00</p>
                          <p className="mt-2 text-xs text-muted-foreground">{suggestion.reason}</p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </TabsContent>
                {selectedAccounts.map((account) => {
                  const key = String(account._id);
                  const meta = variantMeta[key] ?? EMPTY_VARIANT_META;
                  const text = variantText[key] ?? "";
                  const characterLimit = getPlatformCharacterLimit(account.platform);
                  const threadParts = buildTwitterThreadParts(text);

                  return (
                    <TabsContent key={account._id} value={key} className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="capitalize">{account.platform} Text</Label>
                          <p className="text-xs text-muted-foreground">
                            {text.length}
                            {characterLimit ? ` / ${characterLimit}` : ""} characters
                          </p>
                        </div>
                        <Textarea
                          rows={6}
                          value={text}
                          onChange={(event) => setVariantText((current) => ({ ...current, [key]: event.target.value }))}
                          placeholder={`Write the ${account.platform} caption`}
                        />
                        {characterLimit && text.length > characterLimit ? (
                          <p className="text-xs text-destructive">This copy is over the recommended {account.platform} limit.</p>
                        ) : null}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Media URLs</Label>
                          <Textarea
                            rows={4}
                            value={variantMedia[key] ?? ""}
                            onChange={(event) => setVariantMedia((current) => ({ ...current, [key]: event.target.value }))}
                            placeholder="One media URL per line"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Media Type</Label>
                          <Select value={meta.mediaType} onValueChange={(value) => setVariantMetaField(key, "mediaType", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["image", "video", "carousel", "reel"].map((mediaType) => (
                                <SelectItem key={mediaType} value={mediaType}>
                                  {mediaType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Link URL</Label>
                          <Input value={meta.linkUrl} onChange={(event) => setVariantMetaField(key, "linkUrl", event.target.value)} placeholder="https://example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Link Title</Label>
                          <Input value={meta.linkTitle} onChange={(event) => setVariantMetaField(key, "linkTitle", event.target.value)} placeholder="Open Day Registration" />
                        </div>
                        <div className="space-y-2">
                          <Label>Link Description</Label>
                          <Input value={meta.linkDescription} onChange={(event) => setVariantMetaField(key, "linkDescription", event.target.value)} placeholder="A short card description" />
                        </div>
                      </div>
                      {account.platform === "twitter" ? (
                        <div className="space-y-3 rounded-lg border p-4">
                          <div>
                            <p className="font-medium">Thread Builder</p>
                            <p className="text-sm text-muted-foreground">Separate thread posts with a blank line.</p>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            {threadParts.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No thread segments detected yet.</p>
                            ) : (
                              threadParts.map((part, index) => (
                                <div key={`${key}-part-${index}`} className="rounded-lg bg-muted/40 p-3 text-sm">
                                  <p className="mb-1 font-medium">Part {index + 1}</p>
                                  <p className="whitespace-pre-wrap">{part}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : null}
                      {(account.platform === "twitter" || account.platform === "telegram") ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Poll Options</Label>
                            <Input
                              value={meta.pollOptions}
                              onChange={(event) => setVariantMetaField(key, "pollOptions", event.target.value)}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Poll Duration (minutes)</Label>
                            <Input
                              type="number"
                              min={5}
                              value={meta.pollDurationMinutes}
                              onChange={(event) => setVariantMetaField(key, "pollDurationMinutes", event.target.value)}
                            />
                          </div>
                        </div>
                      ) : null}
                      {account.platform === "youtube" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>YouTube Title</Label>
                            <Input value={meta.youtubeTitle} onChange={(event) => setVariantMetaField(key, "youtubeTitle", event.target.value)} placeholder="YouTube video title" />
                          </div>
                          <div className="space-y-2">
                            <Label>YouTube Tags</Label>
                            <Input value={meta.youtubeTags} onChange={(event) => setVariantMetaField(key, "youtubeTags", event.target.value)} placeholder="tag1, tag2, tag3" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>YouTube Description</Label>
                            <Textarea value={meta.youtubeDescription} onChange={(event) => setVariantMetaField(key, "youtubeDescription", event.target.value)} rows={4} />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Input value={meta.youtubeCategory} onChange={(event) => setVariantMetaField(key, "youtubeCategory", event.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Privacy</Label>
                            <Select value={meta.youtubePrivacy} onValueChange={(value) => setVariantMetaField(key, "youtubePrivacy", value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["public", "unlisted", "private"].map((privacy) => (
                                  <SelectItem key={privacy} value={privacy}>
                                    {privacy}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : null}
                      {account.platform === "tiktok" ? (
                        <div className="space-y-2">
                          <Label>TikTok Caption</Label>
                          <Textarea value={meta.tiktokCaption} onChange={(event) => setVariantMetaField(key, "tiktokCaption", event.target.value)} rows={4} />
                        </div>
                      ) : null}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleSave(false)}>Save Draft</Button>
              <Button variant="secondary" onClick={() => handleSave(true)}>
                {scope === "teacher" ? "Submit For Approval" : "Save & Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SocialAnalyticsPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.view_analytics", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.view_analytics");
  const { sessionToken, isLoading } = useAuth();
  const args = buildArgs(sessionToken, scope);
  const canQuery = Boolean(sessionToken && (!requiredPermission || access.allowed));
  const analytics = useQuery(api.modules.social.analytics.getAnalytics, canQuery ? args : "skip") as any;
  const posts = useQuery(api.modules.social.posts.getPosts, canQuery ? args : "skip") as any[] | undefined;

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || analytics === undefined || posts === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const rows = asArray<any>(analytics.rows);
  const trend = buildSocialTrend(rows.slice().reverse());
  const breakdown = buildPlatformBreakdown(rows);
  const postLookup = new Map(asArray<any>(posts).map((post) => [String(post._id), post.title]));
  const bestRow = rows.reduce<any | null>((best, row) => (!best || (row.impressions ?? 0) > (best.impressions ?? 0) ? row : best), null);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Track reach, engagement, followers, and platform-level trends." breadcrumbs={breadcrumbsFor(scope, "Analytics")} />
      <SocialNav scope={scope} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Impressions" value={analytics.summary?.impressions ?? 0} icon={<Share2 className="h-4 w-4" />} />
        <StatCard title="Reach" value={analytics.summary?.reach ?? 0} icon={<ChartColumn className="h-4 w-4" />} />
        <StatCard title="Engagements" value={analytics.summary?.engagements ?? 0} icon={<MessageSquare className="h-4 w-4" />} />
        <StatCard title="Follower Growth" value={analytics.summary?.followers ?? 0} icon={<UserRoundCheck className="h-4 w-4" />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Reach and engagements over time across connected social channels.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {trend.length === 0 ? (
              <SocialEmptyState title="No analytics data yet" description="Analytics will appear after content is published and sync jobs pull metrics." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="reach" stroke="#2563eb" strokeWidth={2} fillOpacity={0} />
                  <Area type="monotone" dataKey="engagements" stroke="#16a34a" strokeWidth={2} fill="url(#engagementGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Best Performer</CardTitle>
            <CardDescription>The strongest row in the current analytics window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestRow ? (
              <>
                <div className="rounded-lg border p-4">
                  <p className="font-medium capitalize">{bestRow.platform}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bestRow.postId ? postLookup.get(String(bestRow.postId)) ?? "Published post" : "Account-level metrics"}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                      <p className="text-xl font-semibold">{formatNumber(bestRow.impressions)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reach</p>
                      <p className="text-xl font-semibold">{formatNumber(bestRow.reach)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Metric pulled</p>
                  <p className="font-medium">{formatDateTime(bestRow.periodEnd)}</p>
                </div>
              </>
            ) : (
              <SocialEmptyState title="No performance rows yet" description="Once analytics syncs, the best-performing content will appear here." />
            )}
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Platform Breakdown</TabsTrigger>
          <TabsTrigger value="distribution">Impression Share</TabsTrigger>
        </TabsList>
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Per-Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="h-80">
                {breakdown.length === 0 ? (
                  <SocialEmptyState title="No platform totals yet" description="Platform totals appear after analytics rows are available." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdown}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="platform" tickLine={false} axisLine={false} />
                      <RechartsTooltip />
                      <Bar dataKey="impressions" radius={[8, 8, 0, 0]} fill="#2563eb" />
                      <Bar dataKey="engagements" radius={[8, 8, 0, 0]} fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-3">
                {breakdown.map((row) => (
                  <div key={row.platform} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">{row.platform}</p>
                      <Badge variant="outline">{formatNumber(row.impressions)} impressions</Badge>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Reach</p>
                        <p className="font-semibold">{formatNumber(row.reach)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Engagements</p>
                        <p className="font-semibold">{formatNumber(row.engagements)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Followers</p>
                        <p className="font-semibold">{formatNumber(row.followers)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Impression Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {breakdown.length === 0 ? (
                <SocialEmptyState title="No distribution yet" description="Publish and sync analytics to see platform share." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} dataKey="impressions" nameKey="platform" innerRadius={70} outerRadius={110}>
                      {breakdown.map((entry, index) => (
                        <Cell key={entry.platform} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SocialCommentsPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.manage_comments", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.manage_comments");
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const args = buildArgs(sessionToken, scope);
  const canQuery = Boolean(sessionToken && (!requiredPermission || access.allowed));
  const comments = useQuery(api.modules.social.comments.getComments, canQuery ? args : "skip") as any[] | undefined;
  const replyToComment = useAction(api.modules.social.comments.replyToComment);
  const hideComment = useAction(api.modules.social.comments.hideComment);
  const deleteComment = useAction(api.modules.social.comments.deleteComment);
  const generateCommentReply = useAction(api.modules.social.ai.generateCommentReply);
  const markRead = useMutation(api.modules.social.comments.markCommentRead);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || comments === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const safeComments = asArray<any>(comments);
  const platforms = Array.from(new Set(safeComments.map((comment) => comment.platform)));
  const filteredComments = safeComments.filter((comment) => {
    const matchesPlatform = platformFilter === "all" || comment.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || comment.status === statusFilter;
    const matchesSearch =
      search.trim() === "" ||
      `${comment.authorName} ${comment.authorHandle ?? ""} ${comment.body}`.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Comments" description="Unified inbox for replies, moderation, and AI-assisted responses." breadcrumbs={breadcrumbsFor(scope, "Comments")} />
      <SocialNav scope={scope} />
      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search author or comment" />
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["new", "read", "replied", "hidden", "deleted_on_platform"].map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <SocialEmptyState title="No comments match these filters" description="Pulled comments will appear here once published posts start receiving engagement." />
        ) : (
          filteredComments.map((comment) => (
            <Card key={comment._id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {comment.platform} {comment.authorHandle ? `• ${comment.authorHandle}` : ""}
                    </p>
                  </div>
                  <Badge variant={statusTone(comment.status)}>{comment.status}</Badge>
                </div>
                <p className="text-sm">{comment.body}</p>
                <Textarea
                  rows={2}
                  placeholder="Write a reply"
                  value={replyDrafts[String(comment._id)] ?? ""}
                  onChange={(event) => setReplyDrafts((current) => ({ ...current, [String(comment._id)]: event.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const result = await generateCommentReply({
                        ...args,
                        commentText: comment.body,
                        tone: "warm",
                      });
                      setReplyDrafts((current) => ({ ...current, [String(comment._id)]: result.reply ?? "" }));
                    }}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Reply
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await replyToComment({
                        ...args,
                        commentId: comment._id,
                        replyText: replyDrafts[String(comment._id)] ?? "",
                      });
                      toast({ title: "Reply sent", description: "The comment has been marked as replied." });
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await markRead({ ...args, commentId: comment._id });
                      toast({ title: "Marked read", description: "The comment is no longer new." });
                    }}
                  >
                    Mark Read
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await hideComment({ ...args, commentId: comment._id });
                      toast({ title: "Comment hidden", description: "The comment has been hidden where supported." });
                    }}
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      await deleteComment({ ...args, commentId: comment._id });
                      toast({ title: "Comment deleted", description: "The comment was removed on the platform where supported." });
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function SocialCalendarPage({ scope }: { scope: SocialScope }) {
  const requiredPermission = platformPermission("social.view", scope);
  const access = usePlatformPageAccess(scope, requiredPermission ?? "social.view");
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<"month" | "week">("month");
  const [focusedDate, setFocusedDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
  const month = focusedDate.getMonth() + 1;
  const year = focusedDate.getFullYear();
  const posts = useQuery(
    api.modules.social.posts.getPostsForCalendar,
    sessionToken && (!requiredPermission || access.allowed)
      ? { ...buildArgs(sessionToken, scope), month, year }
      : "skip"
  ) as any[] | undefined;
  const reschedulePost = useMutation(api.modules.social.posts.reschedulePost);

  if (scope === "platform" && !access.isReady) {
    return <LoadingSkeleton variant="page" />;
  }
  if (scope === "platform" && requiredPermission && !access.allowed) {
    return <SocialAccessDenied scope={scope} permission={requiredPermission} />;
  }
  if (isLoading || !sessionToken || posts === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const safePosts = asArray<any>(posts);
  const grouped = groupPostsByCalendarDay(safePosts);
  const days = getCalendarRange(view, focusedDate);
  const selectedDayPosts = selectedDateKey ? grouped[selectedDateKey] ?? [] : [];

  const changeRange = (direction: -1 | 1) => {
    setFocusedDate((current) => {
      const next = new Date(current);
      if (view === "month") {
        next.setMonth(current.getMonth() + direction);
      } else {
        next.setDate(current.getDate() + direction * 7);
      }
      return next;
    });
  };

  const movePostToDate = async (postId: string, date: Date) => {
    const next = new Date(date);
    next.setHours(9, 0, 0, 0);
    await reschedulePost({
      ...buildArgs(sessionToken, scope),
      postId: postId as any,
      scheduledAt: next.getTime(),
    });
    toast({ title: "Post rescheduled", description: `Moved to ${next.toLocaleString()}.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Content Calendar" description="Switch between month and week views, drag posts, and prefill new drafts from a selected day." breadcrumbs={breadcrumbsFor(scope, "Calendar")} />
      <SocialNav scope={scope} />
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeRange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => changeRange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div>
              <p className="font-medium">
                {focusedDate.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">{view === "month" ? "Month view" : "Week view"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>
              Month
            </Button>
            <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>
              Week
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className={view === "month" ? "grid gap-4 md:grid-cols-7" : "grid gap-4 md:grid-cols-7"}>
        {days.map((day) => {
          const key = formatCalendarDateKey(day);
          const dayPosts = grouped[key] ?? [];
          const isCurrentMonth = day.getMonth() === focusedDate.getMonth();
          const isSelected = selectedDateKey === key;
          return (
            <div
              key={key}
              className={`min-h-[180px] rounded-xl border p-3 transition ${isSelected ? "border-primary bg-primary/5" : ""} ${isCurrentMonth ? "bg-background" : "bg-muted/30"}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={async () => {
                if (draggingPostId) {
                  await movePostToDate(draggingPostId, day);
                  setDraggingPostId(null);
                }
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <button type="button" className="text-left" onClick={() => setSelectedDateKey(key)}>
                  <p className={`text-sm font-medium ${sameCalendarDay(day, new Date()) ? "text-primary" : ""}`}>{day.getDate()}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                </button>
                <Link href={`${socialBasePath(scope)}/posts/create?date=${key}`}>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {dayPosts.slice(0, view === "month" ? 3 : 6).map((post) => (
                  <Link
                    key={post._id}
                    href={`${socialBasePath(scope)}/posts/${post._id}`}
                    draggable
                    onDragStart={() => setDraggingPostId(String(post._id))}
                    className="block rounded-lg border bg-white/90 p-2 text-xs transition hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-2 font-medium">{post.title}</p>
                      <Badge variant={statusTone(post.status)} className="text-[10px]">
                        {post.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {dayPosts.length > (view === "month" ? 3 : 6) ? (
                  <p className="text-xs text-muted-foreground">+{dayPosts.length - (view === "month" ? 3 : 6)} more</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{selectedDateKey ? `Posts for ${selectedDateKey}` : "Select a day"}</CardTitle>
          <CardDescription>Click a day to inspect its content queue or drag a post onto another day to reschedule it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedDateKey === null ? (
            <p className="text-sm text-muted-foreground">Choose a day in the calendar to inspect its scheduled content.</p>
          ) : selectedDayPosts.length === 0 ? (
            <SocialEmptyState
              title="No posts scheduled for this day"
              description="Create a new post for this date from the calendar."
              action={
                <Link href={`${socialBasePath(scope)}/posts/create?date=${selectedDateKey}`}>
                  <Button size="sm">Create Post For This Day</Button>
                </Link>
              }
            />
          ) : (
            selectedDayPosts.map((post) => (
              <div key={post._id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(post.scheduledAt ?? post.createdAt)}</p>
                  </div>
                  <Badge variant={statusTone(post.status)}>{post.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TeacherSocialStatusPage() {
  return <SocialPostsPage scope="teacher" />;
}
