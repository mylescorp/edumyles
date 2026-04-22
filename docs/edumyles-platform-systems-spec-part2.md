# EduMyles Platform Systems — Continued
## Supplement to Main Spec v1.0 | April 2026

---

# SECTION 20 — EMAIL TEMPLATES (PLATFORM USERS)

---

## 20.1 Platform Invite Email

```typescript
// convex/emails/platformInvite.tsx
// Resend React Email template

import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Link, Preview, Section, Text,
} from "@react-email/components";

interface PlatformInviteEmailProps {
  firstName: string;
  inviterName: string;
  roleName: string;
  personalMessage?: string;
  token: string;
  expiresAt: number;
  permissions: string[];
}

const PERMISSION_SUMMARIES: Record<string, string> = {
  "tenants.view": "View and manage school accounts",
  "tenants.create": "Create new school accounts",
  "tenants.impersonate": "Access school portals as an admin",
  "billing.view_dashboard": "View billing and financial data",
  "billing.manage_invoices": "Create and manage invoices",
  "marketplace.review_modules": "Review and approve marketplace modules",
  "crm.view_own": "Manage CRM leads and deals",
  "crm.view_all": "View all team CRM leads and deals",
  "support.view": "View and respond to support tickets",
  "analytics.view_platform": "View platform analytics",
  "waitlist.invite": "Invite new schools to EduMyles",
  "pm.view_own": "Access project management",
  "pm.view_all": "View all team projects and tasks",
};

function getPermissionSummaries(permissions: string[]): string[] {
  const summaries = new Set<string>();
  for (const perm of permissions) {
    const summary = PERMISSION_SUMMARIES[perm];
    if (summary) summaries.add(summary);
  }
  return [...summaries].slice(0, 5);
}

export default function PlatformInviteEmail({
  firstName,
  inviterName,
  roleName,
  personalMessage,
  token,
  expiresAt,
  permissions,
}: PlatformInviteEmailProps) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_PLATFORM_URL}/platform/invite/accept?token=${token}`;
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-KE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const summaries = getPermissionSummaries(permissions);

  return (
    <Html>
      <Head />
      <Preview>You've been invited to join the EduMyles team as {roleName}</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden" }}>
          {/* Header */}
          <Section style={{ backgroundColor: "#0070F3", padding: "24px 40px" }}>
            <Img src="https://edumyles.co.ke/logo-white.png" alt="EduMyles" height={32} />
          </Section>

          {/* Body */}
          <Section style={{ padding: "40px" }}>
            <Heading style={{ fontSize: "24px", fontWeight: "700", color: "#0a0a0a", marginTop: 0 }}>
              Hi {firstName} 👋
            </Heading>
            <Text style={{ color: "#525252", fontSize: "16px", lineHeight: "1.6" }}>
              <strong>{inviterName}</strong> has invited you to join the <strong>EduMyles</strong> team
              as a <strong>{roleName}</strong>.
            </Text>

            {personalMessage && (
              <Section style={{
                padding: "16px 20px",
                backgroundColor: "#f0f7ff",
                borderLeft: "4px solid #0070F3",
                borderRadius: "0 6px 6px 0",
                marginBottom: "24px",
              }}>
                <Text style={{ color: "#0a0a0a", fontStyle: "italic", margin: 0 }}>
                  "{personalMessage}"
                </Text>
                <Text style={{ color: "#888", fontSize: "13px", margin: "8px 0 0" }}>
                  — {inviterName}
                </Text>
              </Section>
            )}

            <Text style={{ color: "#525252", fontSize: "15px", marginBottom: "8px" }}>
              As a <strong>{roleName}</strong>, you'll be able to:
            </Text>
            <ul style={{ color: "#525252", fontSize: "15px", lineHeight: "1.8", paddingLeft: "20px" }}>
              {summaries.map((s, i) => <li key={i}>{s}</li>)}
            </ul>

            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Button
                href={acceptUrl}
                style={{
                  backgroundColor: "#0070F3",
                  color: "#ffffff",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Accept Invitation →
              </Button>
            </Section>

            <Text style={{ color: "#888", fontSize: "13px", textAlign: "center" }}>
              This invitation expires on <strong>{expiryDate}</strong>.<br />
              If you weren't expecting this, you can safely ignore this email.
            </Text>
          </Section>

          <Hr style={{ borderColor: "#e6e6e6" }} />

          {/* Footer */}
          <Section style={{ padding: "20px 40px", backgroundColor: "#f9f9f9" }}>
            <Text style={{ color: "#aaa", fontSize: "12px", textAlign: "center", margin: 0 }}>
              EduMyles | Nairobi, Kenya<br />
              <Link href={`${process.env.NEXT_PUBLIC_PLATFORM_URL}`} style={{ color: "#aaa" }}>
                platform.edumyles.co.ke
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

## 20.2 Invite Accepted Notification Email

```typescript
// convex/emails/inviteAccepted.tsx
// Sent to inviter when their invitation is accepted

export default function InviteAcceptedEmail({
  inviterFirstName,
  acceptedName,
  acceptedEmail,
  roleName,
  acceptedAt,
}: {
  inviterFirstName: string;
  acceptedName: string;
  acceptedEmail: string;
  roleName: string;
  acceptedAt: number;
}) {
  const profileUrl = `${process.env.NEXT_PUBLIC_PLATFORM_URL}/platform/users`;
  return (
    <Html>
      <Head />
      <Preview>{acceptedName} has joined the EduMyles team</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "8px", padding: "40px" }}>
          <Text style={{ fontSize: "32px", textAlign: "center" }}>🎉</Text>
          <Heading style={{ textAlign: "center", color: "#0a0a0a" }}>
            Your invitation was accepted!
          </Heading>
          <Text style={{ color: "#525252", fontSize: "16px", textAlign: "center" }}>
            <strong>{acceptedName}</strong> ({acceptedEmail}) has joined the
            EduMyles team as a <strong>{roleName}</strong>.
          </Text>
          <Text style={{ color: "#888", fontSize: "13px", textAlign: "center" }}>
            Accepted on {new Date(acceptedAt).toLocaleDateString("en-KE", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </Text>
          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Button href={profileUrl}
              style={{ backgroundColor: "#0070F3", color: "#fff", padding: "12px 28px", borderRadius: "6px", textDecoration: "none" }}>
              View Team →
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

## 20.3 Account Suspended Email

```typescript
// convex/emails/accountSuspended.tsx
// Sent to platform user when their account is suspended

export default function AccountSuspendedEmail({
  firstName,
  reason,
  suspendedBy,
  contactEmail,
}: {
  firstName: string;
  reason: string;
  suspendedBy: string;
  contactEmail: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your EduMyles platform access has been suspended</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ color: "#dc2626", fontSize: "22px" }}>Account Suspended</Heading>
          <Text style={{ color: "#525252", fontSize: "15px" }}>
            Hi {firstName},
          </Text>
          <Text style={{ color: "#525252", fontSize: "15px", lineHeight: "1.6" }}>
            Your access to the EduMyles platform has been suspended by {suspendedBy}.
          </Text>
          {reason && (
            <Section style={{ padding: "12px 16px", backgroundColor: "#fef2f2", borderLeft: "4px solid #dc2626", borderRadius: "0 6px 6px 0" }}>
              <Text style={{ color: "#7f1d1d", margin: 0, fontSize: "14px" }}>
                <strong>Reason:</strong> {reason}
              </Text>
            </Section>
          )}
          <Text style={{ color: "#525252", fontSize: "15px", marginTop: "20px" }}>
            If you believe this is an error or need clarification, please contact:
            <br />
            <Link href={`mailto:${contactEmail}`} style={{ color: "#0070F3" }}>{contactEmail}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

## 20.4 CRM Proposal Email

```typescript
// convex/emails/crmProposal.tsx
// Sent to school contact when a proposal is shared

export default function CRMProposalEmail({
  contactName,
  schoolName,
  proposalUrl,
  validUntil,
  plan,
  totalMonthlyKes,
  senderName,
  senderTitle,
  senderPhone,
}: {
  contactName: string;
  schoolName: string;
  proposalUrl: string;
  validUntil: number;
  plan: string;
  totalMonthlyKes: number;
  senderName: string;
  senderTitle: string;
  senderPhone: string;
}) {
  const validUntilStr = new Date(validUntil).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>Your EduMyles proposal for {schoolName} is ready to view</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#0070F3", padding: "24px 40px" }}>
            <Img src="https://edumyles.co.ke/logo-white.png" alt="EduMyles" height={32} />
          </Section>

          <Section style={{ padding: "40px" }}>
            <Heading style={{ fontSize: "22px", color: "#0a0a0a", marginTop: 0 }}>
              Your EduMyles Proposal is Ready
            </Heading>
            <Text style={{ color: "#525252", fontSize: "15px", lineHeight: "1.6" }}>
              Dear {contactName},
            </Text>
            <Text style={{ color: "#525252", fontSize: "15px", lineHeight: "1.6" }}>
              Thank you for your interest in EduMyles for {schoolName}. We've prepared
              a custom proposal tailored to your school's needs.
            </Text>

            <Section style={{
              backgroundColor: "#f0f7ff",
              borderRadius: "8px",
              padding: "20px 24px",
              margin: "24px 0",
              border: "1px solid #bfdbfe",
            }}>
              <Text style={{ margin: 0, color: "#1e40af", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Proposal Summary
              </Text>
              <Text style={{ margin: "8px 0 0", color: "#0a0a0a", fontSize: "20px", fontWeight: "700" }}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
              </Text>
              <Text style={{ margin: "4px 0 0", color: "#525252", fontSize: "16px" }}>
                From KES {totalMonthlyKes.toLocaleString()} / month
              </Text>
              <Text style={{ margin: "8px 0 0", color: "#888", fontSize: "13px" }}>
                Valid until {validUntilStr}
              </Text>
            </Section>

            <Section style={{ textAlign: "center", margin: "28px 0" }}>
              <Button
                href={proposalUrl}
                style={{
                  backgroundColor: "#0070F3",
                  color: "#ffffff",
                  padding: "14px 36px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                View Full Proposal →
              </Button>
            </Section>

            <Text style={{ color: "#525252", fontSize: "15px", lineHeight: "1.6" }}>
              Questions? I'm here to help.
            </Text>
            <Text style={{ color: "#525252", fontSize: "15px", margin: 0 }}>
              <strong>{senderName}</strong><br />
              {senderTitle}<br />
              <Link href={`tel:${senderPhone}`} style={{ color: "#0070F3" }}>{senderPhone}</Link><br />
              <Link href={`mailto:${senderName.toLowerCase().replace(" ", ".")}@edumyles.co.ke`} style={{ color: "#0070F3" }}>
                {senderName.toLowerCase().replace(" ", ".")}@edumyles.co.ke
              </Link>
            </Text>
          </Section>

          <Hr style={{ borderColor: "#e6e6e6" }} />
          <Section style={{ padding: "20px 40px", backgroundColor: "#f9f9f9" }}>
            <Text style={{ color: "#aaa", fontSize: "12px", textAlign: "center", margin: 0 }}>
              EduMyles | Nairobi, Kenya | edumyles.co.ke
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

---

# SECTION 21 — NOTIFICATION SYSTEM (PLATFORM-LEVEL)

---

## 21.1 Platform Notifications Schema

```typescript
// In convex/schema.ts

platform_notifications: defineTable({
  targetPlatformUserId: v.string(),    // platform_user who receives this
  title: v.string(),
  body: v.optional(v.string()),
  actionUrl: v.optional(v.string()),   // deep link within /platform
  type: v.union(
    // User management
    v.literal("invite_accepted"),
    v.literal("invite_resent"),
    v.literal("account_suspended"),
    v.literal("account_unsuspended"),
    v.literal("permission_changed"),
    v.literal("access_expiring"),
    // CRM
    v.literal("lead_assigned"),
    v.literal("lead_shared"),
    v.literal("lead_stage_changed"),
    v.literal("follow_up_due"),
    v.literal("follow_up_overdue"),
    v.literal("proposal_viewed"),
    v.literal("proposal_accepted"),
    v.literal("proposal_rejected"),
    // PM
    v.literal("task_assigned"),
    v.literal("task_mention"),
    v.literal("task_due_today"),
    v.literal("task_overdue"),
    v.literal("project_member_added"),
    v.literal("project_shared"),
    v.literal("project_status_changed"),
    v.literal("sprint_starting"),
    v.literal("sprint_ending"),
    // Tenant/Platform
    v.literal("tenant_stalled"),
    v.literal("tenant_activated"),
    v.literal("tenant_converted"),
    v.literal("trial_expiring"),
    v.literal("trial_expired"),
    v.literal("new_high_value_lead"),
    v.literal("system"),
  ),
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  metadata: v.optional(v.string()),    // JSON extra data
  createdAt: v.number(),
})
  .index("by_targetPlatformUserId", ["targetPlatformUserId"])
  .index("by_targetPlatformUserId_isRead", ["targetPlatformUserId", "isRead"])
  .index("by_createdAt", ["createdAt"]),
```

## 21.2 Notification Functions

```typescript
// convex/modules/platform/notifications.ts

export async function createPlatformNotification(
  ctx: MutationCtx,
  params: {
    targetPlatformUserId: string;
    title: string;
    body?: string;
    actionUrl?: string;
    type: string;
    priority?: "low" | "medium" | "high" | "critical";
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await ctx.db.insert("platform_notifications", {
    targetPlatformUserId: params.targetPlatformUserId,
    title: params.title,
    body: params.body,
    actionUrl: params.actionUrl,
    type: params.type as any,
    isRead: false,
    priority: params.priority ?? "medium",
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    createdAt: Date.now(),
  });
}

export const getMyNotifications = query({
  args: {
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { notifications: [], unreadCount: 0 };

    const platformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .unique();
    if (!platformUser) return { notifications: [], unreadCount: 0 };

    let notifs = await ctx.db
      .query("platform_notifications")
      .withIndex("by_targetPlatformUserId", q =>
        q.eq("targetPlatformUserId", platformUser._id)
      )
      .order("desc")
      .take(args.limit ?? 50);

    if (args.unreadOnly) notifs = notifs.filter(n => !n.isRead);
    if (args.type) notifs = notifs.filter(n => n.type === args.type);

    const unreadCount = await ctx.db
      .query("platform_notifications")
      .withIndex("by_targetPlatformUserId_isRead", q =>
        q.eq("targetPlatformUserId", platformUser._id).eq("isRead", false)
      )
      .collect()
      .then(r => r.length);

    return { notifications: notifs, unreadCount };
  }
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("platform_notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const notif = await ctx.db.get(args.notificationId);
    if (!notif) return;
    await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
  }
});

export const markAllNotificationsRead = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const platformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .unique();
    if (!platformUser) return;

    const unread = await ctx.db
      .query("platform_notifications")
      .withIndex("by_targetPlatformUserId_isRead", q =>
        q.eq("targetPlatformUserId", platformUser._id).eq("isRead", false)
      )
      .collect();

    for (const notif of unread) {
      await ctx.db.patch(notif._id, { isRead: true, readAt: Date.now() });
    }
  }
});

// Cron: notify about tasks due today
export const sendTaskDueNotifications = internalMutation({
  handler: async (ctx) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksDueToday = await ctx.db
      .query("pm_tasks")
      .withIndex("by_dueDate", q =>
        q.gte("dueDate", today.getTime()).lt("dueDate", tomorrow.getTime())
      )
      .filter(q =>
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.neq(q.field("status"), "done"),
          q.neq(q.field("status"), "cancelled"),
        )
      )
      .collect();

    for (const task of tasksDueToday) {
      if (!task.assigneeId) continue;
      const platformUser = await ctx.db
        .query("platform_users")
        .withIndex("by_userId", q => q.eq("userId", task.assigneeId!))
        .unique();
      if (!platformUser) continue;

      await createPlatformNotification(ctx, {
        targetPlatformUserId: platformUser._id,
        title: `Task due today: ${task.title}`,
        actionUrl: `/platform/pm/${task.projectId}?task=${task._id}`,
        type: "task_due_today",
        priority: task.priority === "critical" ? "critical" : "high",
      });
    }
  }
});

// Cron: notify about follow-ups due
export const checkOverdueFollowUps = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const overdue = await ctx.db
      .query("crm_follow_ups")
      .withIndex("by_dueAt", q => q.lt("dueAt", now))
      .filter(q =>
        q.and(
          q.eq(q.field("isOverdue"), false),
          q.eq(q.field("completedAt"), undefined),
        )
      )
      .collect();

    for (const followUp of overdue) {
      await ctx.db.patch(followUp._id, { isOverdue: true });
      const platformUser = await ctx.db
        .query("platform_users")
        .withIndex("by_userId", q => q.eq("userId", followUp.assignedToId))
        .unique();
      if (!platformUser) continue;

      const lead = await ctx.db.get(followUp.leadId);
      await createPlatformNotification(ctx, {
        targetPlatformUserId: platformUser._id,
        title: `Follow-up overdue: ${lead?.companyName ?? "Lead"}`,
        body: followUp.title,
        actionUrl: `/platform/crm/${followUp.leadId}`,
        type: "follow_up_overdue",
        priority: "high",
      });
    }
  }
});
```

## 21.3 Notification Bell Component

```typescript
// frontend/src/components/platform/NotificationBell.tsx

export function NotificationBell() {
  const { notifications, unreadCount } = useQuery(api.platform.notifications.getMyNotifications, {
    limit: 10,
  }) ?? { notifications: [], unreadCount: 0 };

  const markRead = useMutation(api.platform.notifications.markNotificationRead);
  const markAllRead = useMutation(api.platform.notifications.markAllNotificationsRead);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              You're all caught up!
            </div>
          ) : (
            notifications.map(notif => (
              <NotificationItem
                key={notif._id}
                notification={notif}
                onRead={() => markRead({ notificationId: notif._id })}
              />
            ))
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Link href="/platform/notifications" className="text-xs text-primary hover:underline">
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ notification, onRead }: {
  notification: any;
  onRead: () => void;
}) {
  const TYPE_ICONS: Record<string, React.ReactNode> = {
    lead_assigned: <UserCheck className="w-4 h-4 text-blue-500" />,
    proposal_viewed: <Eye className="w-4 h-4 text-green-500" />,
    task_assigned: <CheckSquare className="w-4 h-4 text-purple-500" />,
    task_due_today: <Clock className="w-4 h-4 text-yellow-500" />,
    task_overdue: <AlertTriangle className="w-4 h-4 text-red-500" />,
    follow_up_overdue: <AlertTriangle className="w-4 h-4 text-red-500" />,
    tenant_activated: <CheckCircle className="w-4 h-4 text-green-500" />,
    tenant_stalled: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    invite_accepted: <UserPlus className="w-4 h-4 text-green-500" />,
    project_shared: <Share2 className="w-4 h-4 text-blue-500" />,
    lead_shared: <Share2 className="w-4 h-4 text-blue-500" />,
  };

  return (
    <Link
      href={notification.actionUrl ?? "#"}
      onClick={onRead}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${!notification.isRead ? "bg-blue-50/50" : ""}`}
    >
      <div className="mt-0.5 shrink-0">
        {TYPE_ICONS[notification.type] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"} text-foreground`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
      )}
    </Link>
  );
}
```

---

# SECTION 22 — SECURITY HARDENING

---

## 22.1 Platform Admin Route Middleware

```typescript
// frontend/src/middleware.ts
// Next.js middleware — runs on every request

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

export default withAuth(async function middleware(request: NextRequest) {
  const { sessionId, user, organizationId, role } = request.auth ?? {};

  const url = request.nextUrl.clone();
  const isPublicRoute = [
    "/", "/auth", "/invite/accept", "/staff/accept",
    "/join", "/proposals", "/demo", "/maintenance", "/api/webhooks"
  ].some(path => url.pathname.startsWith(path));

  // Public routes — allow through
  if (isPublicRoute) return NextResponse.next();

  // No session — redirect to login
  if (!sessionId || !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Platform admin routes require platform org membership
  if (url.pathname.startsWith("/platform")) {
    const platformOrgId = process.env.NEXT_PUBLIC_WORKOS_PLATFORM_ORG_ID;
    if (organizationId !== platformOrgId) {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }
  }

  // Tenant portal routes — verify tenant membership
  // (handled by subdomain routing and Convex guards)

  return NextResponse.next();
}, {
  // WorkOS AuthKit middleware config
  redirectUri: process.env.NEXT_PUBLIC_APP_URL + "/auth/callback",
  cookieName: "edumyles_session",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
```

## 22.2 Convex Auth Session Tracking

```typescript
// convex/modules/platform/auth.ts

// Called from /platform/auth/callback — after WorkOS auth
export const recordPlatformLogin = mutation({
  args: {
    workosSessionId: v.string(),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const platformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .unique();
    if (!platformUser) return;

    // Check if expired
    if (platformUser.accessExpiresAt && platformUser.accessExpiresAt < Date.now()) {
      throw new ConvexError({
        code: "ACCESS_EXPIRED",
        message: "Your access to this platform has expired. Contact your administrator.",
      });
    }

    // Record session
    await ctx.db.insert("platform_sessions", {
      platformUserId: platformUser._id,
      workosSessionId: args.workosSessionId,
      device: args.device,
      ipAddress: args.ipAddress,
      countryCode: args.countryCode,
      city: args.city,
      isTrusted: false,
      lastActiveAt: Date.now(),
      createdAt: Date.now(),
    });

    // Update last login
    await ctx.db.patch(platformUser._id, {
      lastLogin: Date.now(),
      lastActivityAt: Date.now(),
      sessionCount: (platformUser.sessionCount ?? 0) + 1,
      updatedAt: Date.now(),
    });

    // Alert on login from new country (suspicious)
    if (args.countryCode && platformUser.lastLogin) {
      const lastSession = await ctx.db
        .query("platform_sessions")
        .withIndex("by_platformUserId", q => q.eq("platformUserId", platformUser._id))
        .order("desc")
        .first();
      if (lastSession?.countryCode && lastSession.countryCode !== args.countryCode) {
        // Different country from last login — alert master admins
        await ctx.scheduler.runAfter(0, internal.platform.security.alertSuspiciousLogin, {
          platformUserId: platformUser._id,
          newCountry: args.countryCode,
          oldCountry: lastSession.countryCode,
          ipAddress: args.ipAddress,
        });
      }
    }

    await logAudit(ctx, {
      action: "platform_user.login",
      entity: platformUser._id,
      after: JSON.stringify({
        device: args.device,
        ip: args.ipAddress,
        country: args.countryCode,
        city: args.city,
      }),
      performedBy: identity.subject,
      ipAddress: args.ipAddress,
      platformContext: true,
    });
  }
});

// Track activity to keep lastActivityAt fresh
export const recordPlatformActivity = mutation({
  args: { workosSessionId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const platformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .unique();
    if (!platformUser) return;

    await ctx.db.patch(platformUser._id, { lastActivityAt: Date.now() });

    const session = await ctx.db
      .query("platform_sessions")
      .withIndex("by_workosSessionId", q => q.eq("workosSessionId", args.workosSessionId))
      .unique();
    if (session) {
      await ctx.db.patch(session._id, { lastActiveAt: Date.now() });
    }
  }
});
```

## 22.3 Security Alert System

```typescript
// convex/modules/platform/security.ts

export const alertSuspiciousLogin = internalMutation({
  args: {
    platformUserId: v.string(),
    newCountry: v.string(),
    oldCountry: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Notify all master_admins
    const masterAdmins = await ctx.db
      .query("platform_users")
      .withIndex("by_role", q => q.eq("role", "master_admin"))
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    const affectedUser = await ctx.db.get(args.platformUserId);

    for (const admin of masterAdmins) {
      await createPlatformNotification(ctx, {
        targetPlatformUserId: admin._id,
        title: `⚠️ Suspicious login: ${affectedUser?.firstName} ${affectedUser?.lastName}`,
        body: `Login from ${args.newCountry} (previously ${args.oldCountry}). IP: ${args.ipAddress ?? "unknown"}`,
        actionUrl: `/platform/security`,
        type: "system",
        priority: "critical",
      });
    }

    // Slack alert
    await ctx.scheduler.runAfter(0, internal.platform.slack.sendSecurityAlert, {
      message: `⚠️ Suspicious login detected for ${affectedUser?.email} — login from ${args.newCountry} (last: ${args.oldCountry}), IP: ${args.ipAddress}`,
    });

    await logAudit(ctx, {
      action: "security.suspicious_login",
      entity: args.platformUserId,
      after: JSON.stringify({ newCountry: args.newCountry, oldCountry: args.oldCountry, ip: args.ipAddress }),
      performedBy: "system",
      platformContext: true,
    });
  }
});

// Daily security checks
export const runDailySecurityChecks = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Find inactive platform users (no login in 90 days)
    const inactiveThreshold = now - 90 * 24 * 60 * 60 * 1000;
    const inactiveUsers = await ctx.db
      .query("platform_users")
      .filter(q =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.lt(q.field("lastActivityAt"), inactiveThreshold),
          q.neq(q.field("role"), "master_admin"),
        )
      )
      .collect();

    // Notify master admins about inactive users
    if (inactiveUsers.length > 0) {
      const masterAdmins = await ctx.db
        .query("platform_users")
        .withIndex("by_role", q => q.eq("role", "master_admin"))
        .collect();

      for (const admin of masterAdmins) {
        await createPlatformNotification(ctx, {
          targetPlatformUserId: admin._id,
          title: `${inactiveUsers.length} inactive platform users`,
          body: `Users with no activity in 90+ days: ${inactiveUsers.map(u => u.email).slice(0, 3).join(", ")}${inactiveUsers.length > 3 ? " and more" : ""}`,
          actionUrl: "/platform/users?status=inactive",
          type: "system",
          priority: "low",
        });
      }
    }

    // 2. Find users with access expiring in 7 days
    const expiryWarningAt = now + 7 * 24 * 60 * 60 * 1000;
    const expiringUsers = await ctx.db
      .query("platform_users")
      .withIndex("by_accessExpiresAt", q =>
        q.gt("accessExpiresAt", now).lt("accessExpiresAt", expiryWarningAt)
      )
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    for (const user of expiringUsers) {
      // Notify the user
      await createPlatformNotification(ctx, {
        targetPlatformUserId: user._id,
        title: "Your platform access expires soon",
        body: `Your access expires on ${new Date(user.accessExpiresAt!).toLocaleDateString()}. Contact your manager to extend.`,
        actionUrl: "/platform/profile",
        type: "access_expiring",
        priority: "high",
      });
    }
  }
});
```

---

# SECTION 23 — CRM PIPELINE STAGE CONFIGURATION

---

## 23.1 Default Pipeline Stages (Seed Data)

```typescript
// convex/dev/seed.ts — CRM pipeline stages

const DEFAULT_CRM_STAGES = [
  {
    name: "New Lead",
    slug: "new",
    order: 100,
    color: "#94a3b8",
    icon: "Inbox",
    description: "Freshly captured lead — not yet contacted",
    probabilityDefault: 5,
    isActive: true,
    requiresNote: false,
    autoFollowUpDays: 1,
    isWon: false,
    isLost: false,
  },
  {
    name: "Contacted",
    slug: "contacted",
    order: 200,
    color: "#60a5fa",
    icon: "Phone",
    description: "Initial contact made — awaiting response",
    probabilityDefault: 15,
    isActive: true,
    requiresNote: false,
    autoFollowUpDays: 3,
    isWon: false,
    isLost: false,
  },
  {
    name: "Qualified",
    slug: "qualified",
    order: 300,
    color: "#a78bfa",
    icon: "CheckCircle",
    description: "Budget, authority, need, and timeline confirmed",
    probabilityDefault: 30,
    isActive: true,
    requiresNote: true,       // require note: what qualified them?
    autoFollowUpDays: 3,
    isWon: false,
    isLost: false,
  },
  {
    name: "Demo Booked",
    slug: "demo_booked",
    order: 400,
    color: "#f59e0b",
    icon: "Calendar",
    description: "Product demo scheduled",
    probabilityDefault: 50,
    isActive: true,
    requiresNote: false,
    autoFollowUpDays: null,   // no auto follow-up — date is set by demo booking
    isWon: false,
    isLost: false,
  },
  {
    name: "Demo Done",
    slug: "demo_done",
    order: 500,
    color: "#f97316",
    icon: "Monitor",
    description: "Demo completed — gathering feedback",
    probabilityDefault: 60,
    isActive: true,
    requiresNote: true,       // require note: demo outcome
    autoFollowUpDays: 2,
    isWon: false,
    isLost: false,
  },
  {
    name: "Proposal Sent",
    slug: "proposal_sent",
    order: 600,
    color: "#ec4899",
    icon: "FileText",
    description: "Pricing proposal sent to decision maker",
    probabilityDefault: 70,
    isActive: true,
    requiresNote: false,
    autoFollowUpDays: 4,
    isWon: false,
    isLost: false,
  },
  {
    name: "Negotiation",
    slug: "negotiation",
    order: 700,
    color: "#8b5cf6",
    icon: "MessageSquare",
    description: "Negotiating terms, pricing, or contract",
    probabilityDefault: 80,
    isActive: true,
    requiresNote: false,
    autoFollowUpDays: 2,
    isWon: false,
    isLost: false,
  },
  {
    name: "Won",
    slug: "won",
    order: 800,
    color: "#22c55e",
    icon: "Trophy",
    description: "Deal closed — school invited or signed up",
    probabilityDefault: 100,
    isActive: true,
    requiresNote: true,       // require note: what closed the deal?
    autoFollowUpDays: null,
    isWon: true,
    isLost: false,
  },
  {
    name: "Lost",
    slug: "lost",
    order: 900,
    color: "#ef4444",
    icon: "XCircle",
    description: "Deal lost — school went elsewhere or not interested",
    probabilityDefault: 0,
    isActive: true,
    requiresNote: true,       // require note: why did we lose?
    autoFollowUpDays: 90,     // follow up in 90 days — things change
    isWon: false,
    isLost: true,
  },
];
```

## 23.2 Pipeline Configuration Page `/platform/crm/settings`

```typescript
// /platform/crm/settings — accessible via crm.manage_pipeline permission

// Shows:
// 1. Stage list (draggable to reorder)
// 2. Per-stage: name, color, description, probability, auto-follow-up days
//    requiresNote toggle, isWon/isLost assignment
// 3. Add stage button
// 4. Archive stage button (moves leads to previous stage)
// 5. Cannot delete isWon or isLost stages (system stages)

// Pipeline stage mutations:
export const updatePipelineStage = mutation({
  args: {
    stageId: v.id("crm_pipeline_stages"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    probabilityDefault: v.optional(v.number()),
    requiresNote: v.optional(v.boolean()),
    autoFollowUpDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "crm.manage_pipeline");
    const { stageId, ...updates } = args;
    await ctx.db.patch(stageId, updates);
  }
});

export const reorderPipelineStages = mutation({
  args: {
    stageIds: v.array(v.id("crm_pipeline_stages")),  // new order
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "crm.manage_pipeline");
    for (let i = 0; i < args.stageIds.length; i++) {
      await ctx.db.patch(args.stageIds[i], { order: (i + 1) * 100 });
    }
  }
});

export const createPipelineStage = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    probabilityDefault: v.number(),
    requiresNote: v.boolean(),
    autoFollowUpDays: v.optional(v.number()),
    insertAfterSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "crm.manage_pipeline");
    // Find the stage to insert after and calculate order
    let order = 1000; // default: at end
    if (args.insertAfterSlug) {
      const afterStage = await ctx.db
        .query("crm_pipeline_stages")
        .withIndex("by_slug", q => q.eq("slug", args.insertAfterSlug!))
        .unique();
      if (afterStage) order = afterStage.order + 50;
    }

    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await ctx.db.insert("crm_pipeline_stages", {
      name: args.name,
      slug,
      order,
      color: args.color,
      icon: "Circle",
      description: args.description,
      probabilityDefault: args.probabilityDefault,
      isActive: true,
      requiresNote: args.requiresNote,
      autoFollowUpDays: args.autoFollowUpDays,
      isWon: false,
      isLost: false,
      createdAt: Date.now(),
    });
  }
});
```

---

# SECTION 24 — PM WORKSPACE MANAGEMENT

---

## 24.1 Workspace Access Rules

```typescript
// Workspace visibility:
// isPrivate: true → only workspace members can see it
// isPrivate: false → all platform users can see workspace (but not private projects within)

// Who can manage workspace:
// - Creator: full control
// - pm.manage_workspace permission: full control over any workspace
// - pm.view_all: can see all workspaces and their projects

export const getWorkspaces = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.view_own");
    const canViewAll = hasPermission(permissions, "pm.view_all");

    let workspaces = await ctx.db.query("pm_workspaces")
      .filter(q =>
        args.includeArchived ? true : q.eq(q.field("isArchived"), false)
      )
      .collect();

    if (!canViewAll) {
      workspaces = workspaces.filter(ws =>
        !ws.isPrivate ||
        ws.creatorId === userId ||
        ws.memberIds.includes(userId)
      );
    }

    // Enrich with project count
    const enriched = await Promise.all(workspaces.map(async ws => {
      const projects = await ctx.db.query("pm_projects")
        .withIndex("by_workspaceId", q => q.eq("workspaceId", ws._id))
        .filter(q => q.eq(q.field("isDeleted"), false))
        .collect();
      return {
        ...ws,
        projectCount: projects.length,
        activeProjectCount: projects.filter(p => p.status === "active").length,
      };
    }));

    return enriched;
  }
});

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.string(),
    color: v.string(),
    isPrivate: v.boolean(),
    memberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "pm.create_workspace");

    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const wsId = await ctx.db.insert("pm_workspaces", {
      name: args.name,
      slug,
      description: args.description,
      icon: args.icon,
      color: args.color,
      creatorId: userId,
      memberIds: [...new Set([userId, ...args.memberIds])],
      isPrivate: args.isPrivate,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Notify members
    for (const memberId of args.memberIds) {
      if (memberId === userId) continue;
      await createPlatformNotification(ctx, {
        targetPlatformUserId: memberId,
        title: `Added to workspace: ${args.name}`,
        actionUrl: `/platform/pm/workspaces/${wsId}`,
        type: "project_member_added",
      });
    }

    return wsId;
  }
});
```

---

# SECTION 25 — COMPLETE CRON JOBS REFERENCE

All cron jobs for the three systems — add to `convex/crons.ts`:

```typescript
// ═══ PLATFORM USER MANAGEMENT ════════════════════════════════════════

// Expire old platform invites (72hr) — daily 10:00 PM EAT (19:00 UTC)
crons.daily("expire platform user invites",
  { hourUTC: 19, minuteUTC: 0 },
  internal.platform.users.expirePlatformInvites
);

// Suspend expired contractor accounts — daily 10:30 PM EAT (19:30 UTC)
crons.daily("suspend expired platform access",
  { hourUTC: 19, minuteUTC: 30 },
  internal.platform.users.expireAccessExpiredAccounts
);

// ═══ SECURITY ═════════════════════════════════════════════════════════

// Daily security checks (inactive users, expiring access) — 9:00 AM EAT (06:00 UTC)
crons.daily("run daily security checks",
  { hourUTC: 6, minuteUTC: 0 },
  internal.platform.security.runDailySecurityChecks
);

// ═══ CRM ═════════════════════════════════════════════════════════════

// Check overdue follow-ups — daily 8:00 AM EAT (05:00 UTC)
crons.daily("check overdue crm follow-ups",
  { hourUTC: 5, minuteUTC: 0 },
  internal.platform.crm.checkOverdueFollowUps
);

// Expire CRM lead shares — daily 9:00 AM EAT (06:00 UTC)
crons.daily("expire crm lead shares",
  { hourUTC: 6, minuteUTC: 0 },
  internal.platform.crm.expireCRMShares
);

// Weekly CRM pipeline report to team — Mondays 9:00 AM EAT (06:00 UTC)
crons.weekly("send weekly crm pipeline report",
  { day: "monday", hourUTC: 6, minuteUTC: 0 },
  internal.platform.crm.sendWeeklyPipelineReport
);

// ═══ PROJECT MANAGEMENT ═══════════════════════════════════════════════

// Send task due today notifications — 8:00 AM EAT (05:00 UTC)
crons.daily("send task due today notifications",
  { hourUTC: 5, minuteUTC: 0 },
  internal.platform.notifications.sendTaskDueNotifications
);

// Check overdue tasks — 8:30 AM EAT (05:30 UTC)
crons.daily("check overdue tasks",
  { hourUTC: 5, minuteUTC: 30 },
  internal.pm.tasks.markOverdueTasks
);

// Sprint ending tomorrow notification — daily 9:00 AM EAT (06:00 UTC)
crons.daily("notify sprint ending soon",
  { hourUTC: 6, minuteUTC: 0 },
  internal.pm.sprints.notifySprintEndingSoon
);

// Weekly PM summary to project leads — Mondays 9:00 AM EAT (06:00 UTC)
crons.weekly("send weekly pm summary",
  { day: "monday", hourUTC: 6, minuteUTC: 15 },
  internal.pm.projects.sendWeeklyProjectSummary
);

// Clean up old notifications (> 90 days) — 1st of month 2:00 AM EAT (23:00 UTC)
crons.monthly("purge old platform notifications",
  { day: 1, hourUTC: 23, minuteUTC: 0 },
  internal.platform.notifications.purgeOldNotifications
);
```

---

# SECTION 26 — COMPLETE FRONTEND PAGE REFERENCE

---

## 26.1 All Platform Pages (Platform User, RBAC, CRM, PM)

```
PUBLIC (no auth):
══════════════════════════════════════════════════════════
/platform/invite/accept                  Invite accept (platform staff)
/proposals/[trackingToken]               Public proposal view page

PLATFORM ADMIN (authenticated, platform org):
══════════════════════════════════════════════════════════
/platform                                Dashboard
/platform/notifications                  All notifications

── PLATFORM USERS & RBAC ────────────────────────────────
/platform/users                          Staff list (all tabs)
/platform/users/[userId]                 Staff detail (Profile|Permissions|Sessions|Activity)
/platform/users/roles                    Role management (left sidebar + right panel)
/platform/users/roles/create             Create custom role (5-step form)
/platform/users/roles/[roleId]/edit      Edit custom role

── CRM ───────────────────────────────────────────────────
/platform/crm                            CRM dashboard (my leads, follow-ups, activity)
/platform/crm/leads                      Lead list view (table with filters)
/platform/crm/pipeline                   Kanban pipeline view
/platform/crm/leads/create               Create lead form
/platform/crm/[leadId]                   Lead detail (Overview|Activities|Contacts|Proposals|Share)
/platform/crm/proposals                  All proposals list
/platform/crm/proposals/[id]             Proposal detail
/platform/crm/reports                    CRM analytics (charts + tables)
/platform/crm/settings                   Pipeline stage configuration

── PM ────────────────────────────────────────────────────
/platform/pm                             PM dashboard (my tasks + my projects)
/platform/pm/my-tasks                    All tasks assigned to me (cross-project)
/platform/pm/workspaces                  All workspaces list
/platform/pm/workspaces/create           Create workspace
/platform/pm/workspaces/[wsId]           Workspace detail (project list)
/platform/pm/[projectId]                 Project board (kanban, default view)
/platform/pm/[projectId]/list            Project list view
/platform/pm/[projectId]/gantt           Project gantt chart
/platform/pm/[projectId]/backlog         Sprint backlog management
/platform/pm/[projectId]/sprints         Sprint list and management
/platform/pm/[projectId]/settings        Project settings (General|Members|Integrations|Danger)
/platform/pm/reports                     Team PM reports (time logs, velocity)

── EXISTING PLATFORM PAGES (for sidebar reference) ──────
/platform/tenants                        Tenant list
/platform/tenants/[id]                   Tenant detail
/platform/tenant-success                 Onboarding health dashboard
/platform/waitlist                       Waitlist management
/platform/marketplace                    Marketplace management
/platform/marketplace/pricing            Pricing control
/platform/marketplace/admin              Module review queue
/platform/marketplace/pilot-grants       Pilot grants
/platform/billing                        Billing dashboard
/platform/billing/invoices               All invoices
/platform/billing/subscriptions          All subscriptions
/platform/resellers                      Reseller management
/platform/analytics                      Platform analytics
/platform/security                       Security dashboard
/platform/audit                          Audit log
/platform/settings                       Platform settings (11 tabs)
/platform/knowledge-base                 KB management
```

---

# SECTION 27 — ADDITIONAL MISSING PIECES

---

## 27.1 CRM Lead Import

```typescript
// Bulk import leads from CSV — for migrating from another CRM

export const importLeadsFromCSV = mutation({
  args: {
    leads: v.array(v.object({
      companyName: v.string(),
      contactName: v.string(),
      contactEmail: v.string(),
      contactPhone: v.optional(v.string()),
      country: v.string(),
      studentCount: v.optional(v.number()),
      sourceType: v.optional(v.string()),
    })),
    defaultAssignee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "crm.create_lead");

    const results = [];
    for (const lead of args.leads) {
      try {
        // Check for duplicate email
        const existing = await ctx.db
          .query("crm_leads")
          .withIndex("by_isDeleted", q => q.eq("isDeleted", false))
          .filter(q => q.eq(q.field("contactEmail"), lead.contactEmail))
          .first();

        if (existing) {
          results.push({ email: lead.contactEmail, status: "duplicate", leadId: existing._id });
          continue;
        }

        const leadId = await ctx.db.insert("crm_leads", {
          ...lead,
          contactTitle: undefined,
          county: undefined,
          address: undefined,
          website: undefined,
          schoolType: undefined,
          staffCount: undefined,
          currentSystem: undefined,
          painPoints: [],
          interestedModules: [],
          stage: "new",
          qualificationScore: calculateQualificationScore({
            studentCount: lead.studentCount,
            country: lead.country,
          }),
          ownerId: userId,
          assignedToId: args.defaultAssignee,
          sourceType: (lead.sourceType ?? "other") as any,
          dealValueKes: undefined,
          expectedCloseDate: undefined,
          probability: undefined,
          isArchived: false,
          isDeleted: false,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        results.push({ email: lead.contactEmail, status: "imported", leadId });
      } catch (e: any) {
        results.push({ email: lead.contactEmail, status: "error", error: e.message });
      }
    }

    return results;
  }
});
```

## 27.2 CRM Lead Merge

```typescript
// Merge two duplicate leads

export const mergeLeads = mutation({
  args: {
    primaryLeadId: v.id("crm_leads"),   // keep this one
    duplicateLeadId: v.id("crm_leads"), // merge this into primary
    keepActivities: v.boolean(),
    keepContacts: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "crm.edit_any_lead");

    const primary = await ctx.db.get(args.primaryLeadId);
    const duplicate = await ctx.db.get(args.duplicateLeadId);
    if (!primary || !duplicate) throw new Error("Lead not found");

    // Move activities from duplicate to primary
    if (args.keepActivities) {
      const activities = await ctx.db.query("crm_activities")
        .withIndex("by_leadId", q => q.eq("leadId", args.duplicateLeadId))
        .collect();
      for (const act of activities) {
        await ctx.db.patch(act._id, { leadId: args.primaryLeadId });
      }
    }

    // Move contacts from duplicate to primary
    if (args.keepContacts) {
      const contacts = await ctx.db.query("crm_contacts")
        .withIndex("by_leadId", q => q.eq("leadId", args.duplicateLeadId))
        .collect();
      for (const contact of contacts) {
        await ctx.db.patch(contact._id, { leadId: args.primaryLeadId });
      }
    }

    // Soft delete the duplicate
    await ctx.db.patch(args.duplicateLeadId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    // Log merge activity on primary
    await ctx.db.insert("crm_activities", {
      leadId: args.primaryLeadId,
      type: "system",
      subject: "Lead merged",
      body: `Duplicate lead (${duplicate.companyName} — ${duplicate.contactEmail}) merged into this record.`,
      isPrivate: false,
      createdBy: userId,
      createdAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "crm_lead.merged",
      entity: args.primaryLeadId,
      after: JSON.stringify({ mergedFrom: args.duplicateLeadId }),
      performedBy: userId,
      platformContext: true,
    });
  }
});
```

## 27.3 PM Task Templates

```typescript
// Reusable task templates for common project patterns

pm_task_templates: defineTable({
  workspaceId: v.optional(v.id("pm_workspaces")), // null = global template
  name: v.string(),
  description: v.optional(v.string()),
  tasks: v.array(v.object({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    priority: v.string(),
    estimateHours: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
    tags: v.array(v.string()),
    dependsOnIndex: v.optional(v.number()), // index in this array
    offsetDays: v.optional(v.number()),     // days from project start
  })),
  createdBy: v.string(),
  isPublic: v.boolean(),                   // visible to all team
  usageCount: v.number(),
  createdAt: v.number(),
})
  .index("by_workspaceId", ["workspaceId"])
  .index("by_createdBy", ["createdBy"]),

// Apply template to project
export const applyTaskTemplate = mutation({
  args: {
    projectId: v.id("pm_projects"),
    templateId: v.id("pm_task_templates"),
    sprintId: v.optional(v.id("pm_sprints")),
    projectStartDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "pm.create_task");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const now = args.projectStartDate ?? Date.now();
    const createdTaskIds: string[] = [];

    // Create tasks in order
    for (let i = 0; i < template.tasks.length; i++) {
      const taskDef = template.tasks[i];
      const dueDate = taskDef.offsetDays
        ? now + taskDef.offsetDays * 24 * 60 * 60 * 1000
        : undefined;

      const taskId = await ctx.db.insert("pm_tasks", {
        projectId: args.projectId,
        sprintId: args.sprintId,
        parentTaskId: undefined,
        title: taskDef.title,
        description: taskDef.description,
        type: taskDef.type as any,
        status: "todo",
        priority: taskDef.priority as any,
        creatorId: userId,
        assigneeId: undefined,
        reviewerId: undefined,
        collaboratorIds: [],
        dueDate,
        startDate: undefined,
        estimateHours: taskDef.estimateHours,
        storyPoints: taskDef.storyPoints,
        actualHours: 0,
        tags: taskDef.tags,
        attachments: [],
        isDeleted: false,
        order: (i + 1) * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      createdTaskIds.push(taskId);
    }

    // Update template usage count
    await ctx.db.patch(args.templateId, {
      usageCount: (template.usageCount ?? 0) + 1,
    });

    return { createdTaskIds, count: createdTaskIds.length };
  }
});
```

## 27.4 PM Gantt Chart Data

```typescript
// Query optimized for Gantt chart rendering

export const getGanttData = query({
  args: { projectId: v.id("pm_projects") },
  handler: async (ctx, args) => {
    const { userId, permissions } = await requirePermission(ctx, "pm.view_own");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.isDeleted) throw new Error("Project not found");

    const [tasks, sprints, epics] = await Promise.all([
      ctx.db.query("pm_tasks")
        .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
        .filter(q =>
          q.and(
            q.eq(q.field("isDeleted"), false),
            q.neq(q.field("type"), "epic"),
          )
        )
        .collect(),
      ctx.db.query("pm_sprints")
        .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
        .collect(),
      ctx.db.query("pm_epics")
        .withIndex("by_projectId", q => q.eq("projectId", args.projectId))
        .collect(),
    ]);

    // Build Gantt rows: epics → tasks grouped by epic
    const ganttRows = [
      // Project bar
      {
        id: args.projectId,
        type: "project",
        label: project.name,
        startDate: project.startDate ?? Date.now(),
        endDate: project.endDate ?? (Date.now() + 90 * 24 * 60 * 60 * 1000),
        progress: project.progress,
        color: "#0070F3",
        children: [],
      },
      // Sprint bars
      ...sprints.map(sprint => ({
        id: sprint._id,
        type: "sprint",
        label: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        progress: sprint.status === "completed" ? 100 : sprint.status === "active" ? 50 : 0,
        color: "#8b5cf6",
        children: tasks.filter(t => t.sprintId === sprint._id).map(t => ({
          id: t._id,
          type: "task",
          label: t.title,
          startDate: t.startDate ?? sprint.startDate,
          endDate: t.dueDate ?? sprint.endDate,
          progress: t.status === "done" ? 100 : t.status === "in_progress" ? 50 : 0,
          assigneeId: t.assigneeId,
          priority: t.priority,
          color: t.status === "done" ? "#22c55e" : t.status === "blocked" ? "#ef4444" : "#3b82f6",
        })),
      })),
    ];

    return ganttRows;
  }
});
```

## 27.5 CRM Weekly Report

```typescript
// convex/modules/platform/crm.ts

export const sendWeeklyPipelineReport = internalMutation({
  handler: async (ctx) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Aggregate stats for the week
    const allLeads = await ctx.db.query("crm_leads")
      .filter(q => q.eq(q.field("isDeleted"), false))
      .collect();

    const stats = {
      newLeadsThisWeek: allLeads.filter(l => l.createdAt >= oneWeekAgo).length,
      wonThisWeek: allLeads.filter(l =>
        l.stage === "won" && l.updatedAt >= oneWeekAgo
      ).length,
      lostThisWeek: allLeads.filter(l =>
        l.stage === "lost" && l.updatedAt >= oneWeekAgo
      ).length,
      totalPipelineValueKes: allLeads
        .filter(l => !["won", "lost", "disqualified"].includes(l.stage))
        .reduce((sum, l) => sum + (l.dealValueKes ?? 0), 0),
      byStage: {} as Record<string, number>,
      followUpsDue: allLeads.filter(l =>
        l.nextFollowUpAt && l.nextFollowUpAt <= Date.now()
      ).length,
    };

    // Group by stage
    for (const lead of allLeads.filter(l => !l.isArchived)) {
      stats.byStage[lead.stage] = (stats.byStage[lead.stage] ?? 0) + 1;
    }

    // Get platform managers to notify
    const pmUsers = await ctx.db
      .query("platform_users")
      .withIndex("by_role", q => q.eq("role", "platform_manager"))
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    const superAdmins = await ctx.db
      .query("platform_users")
      .withIndex("by_role", q => q.eq("role", "super_admin"))
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    const recipients = [...pmUsers, ...superAdmins];

    for (const user of recipients) {
      await createPlatformNotification(ctx, {
        targetPlatformUserId: user._id,
        title: `Weekly CRM Report: ${stats.wonThisWeek} deals won, ${stats.newLeadsThisWeek} new leads`,
        body: `Pipeline value: KES ${stats.totalPipelineValueKes.toLocaleString()}. ${stats.followUpsDue} follow-ups overdue.`,
        actionUrl: "/platform/crm/reports",
        type: "system",
        priority: "low",
      });
    }
  }
});
```

## 27.6 PM Weekly Summary

```typescript
// convex/modules/pm/projects.ts

export const sendWeeklyProjectSummary = internalMutation({
  handler: async (ctx) => {
    const projects = await ctx.db.query("pm_projects")
      .filter(q =>
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.eq(q.field("isArchived"), false),
          q.eq(q.field("status"), "active"),
        )
      )
      .collect();

    // For each project lead: send summary of their projects
    const projectsByLead = new Map<string, typeof projects>();
    for (const project of projects) {
      const existing = projectsByLead.get(project.leadId) ?? [];
      projectsByLead.set(project.leadId, [...existing, project]);
    }

    for (const [leadId, leadProjects] of projectsByLead) {
      const leadUser = await ctx.db
        .query("platform_users")
        .withIndex("by_userId", q => q.eq("userId", leadId))
        .unique();
      if (!leadUser || leadUser.status !== "active") continue;

      // Get overdue tasks for their projects
      const now = Date.now();
      let overdueTasks = 0;
      let dueTodayTasks = 0;
      const tomorrow = now + 24 * 60 * 60 * 1000;

      for (const project of leadProjects) {
        const tasks = await ctx.db.query("pm_tasks")
          .withIndex("by_projectId", q => q.eq("projectId", project._id))
          .filter(q =>
            q.and(
              q.eq(q.field("isDeleted"), false),
              q.neq(q.field("status"), "done"),
              q.neq(q.field("status"), "cancelled"),
            )
          )
          .collect();

        overdueTasks += tasks.filter(t => t.dueDate && t.dueDate < now).length;
        dueTodayTasks += tasks.filter(t => t.dueDate && t.dueDate >= now && t.dueDate < tomorrow).length;
      }

      await createPlatformNotification(ctx, {
        targetPlatformUserId: leadUser._id,
        title: `Weekly PM summary: ${leadProjects.length} active project${leadProjects.length === 1 ? "" : "s"}`,
        body: `${overdueTasks} overdue tasks, ${dueTodayTasks} due today. Average progress: ${Math.round(leadProjects.reduce((sum, p) => sum + p.progress, 0) / leadProjects.length)}%`,
        actionUrl: "/platform/pm",
        type: "system",
        priority: "low",
      });
    }
  }
});
```

---

# SECTION 28 — FINAL MISSING PIECES CHECKLIST

---

## 28.1 Things That Were Not Yet Captured

1. **CRM Lead Activity — Email Integration**
   - Option to connect Gmail/Outlook to CRM (future — via Google/Microsoft MCP)
   - For now: manual email logging ("Email sent" activity type)
   - BCC-to-CRM: send email to crm@edumyles.co.ke to auto-log on lead

2. **CRM Lead Score Decay**
   - Leads that haven't been contacted in X days automatically decrease qualification score
   - Visual indicator: score dropping means "at risk of going cold"
   - Cron: daily decay check reduces score by 2 points per 7 days of inactivity

3. **PM — Recurring Tasks**
   - Some tasks repeat weekly/monthly (e.g. "Weekly team sync notes", "Monthly billing report")
   - `pm_tasks.recurrenceRule` field (RRULE format or simple: "weekly_monday")
   - Cron creates next instance when current is completed

4. **PM — Task Dependencies**
   - Task A cannot start until Task B is done
   - `pm_tasks.blockedByTaskIds[]` field
   - Visual: dependency arrows in Gantt view
   - Auto-notify: when blocking task is completed, notify dependent task assignee

5. **PM — Mentions in Descriptions**
   - When editing task description: @mention platform users
   - On save: parse @mentions, notify mentioned users
   - Same pattern as comments mentions

6. **CRM — WhatsApp Direct Integration**
   - "Send WhatsApp" button on lead contact
   - Opens WhatsApp Web with pre-filled message
   - Logs as WhatsApp activity automatically
   - Future: two-way via WhatsApp Business API

7. **Platform User — Profile Page**
   - `/platform/profile` — current user's own profile
   - Edit name, phone, timezone, language preferences
   - Change password (via WorkOS)
   - Enable/disable 2FA (via WorkOS)
   - View own permission set (read-only)
   - View and manage own sessions
   - Notification preferences (which types to receive)

8. **CRM — Team Assignment**
   - Assign leads to a CRM team (not just individual)
   - Team members all see shared leads
   - Team performance reporting
   - Territory-based routing: new leads from Kenya → Kenya team

9. **PM — External Guest Access**
   - Share a project read-only with an external stakeholder (not a platform user)
   - Generate a read-only link with expiry
   - No login required to view
   - Cannot see private notes or activities

10. **Platform Admin — Impersonation Flow**
    - Master Admin or Super Admin can impersonate any tenant admin
    - Impersonation audit log (every action during impersonation logged separately)
    - Visible banner during impersonation: "You are viewing as [School Admin Name]"
    - End impersonation button always visible
    - Time limit: 2 hours per session
    - Cannot create data during impersonation (read-only for safety)

---

## 28.2 Complete Verification Checklist (Additional)

**Platform Users & RBAC:**
- [ ] All 8 system roles seeded with correct permissions
- [ ] Permission keys match PERMISSIONS constant (no typos)
- [ ] Invite flow: WorkOS org membership created on accept
- [ ] Role change: both old and new role.userCount updated
- [ ] Cannot call sensitive mutations without correct permission
- [ ] master_admin["*"] bypasses all permission checks
- [ ] Scope restrictions filter data correctly (scopeCountries enforcement)
- [ ] Session tracking: new login recorded in platform_sessions
- [ ] Suspicious login: different country triggers alert
- [ ] Access expiry: auto-suspend at exact expiry time
- [ ] Permission audit log: every change has before/after JSON

**CRM:**
- [ ] view_own: user A cannot see user B's private leads
- [ ] view_shared: shared lead accessible with correct access level
- [ ] view_all: super_admin sees all leads, can filter by owner
- [ ] Proposal PDF generated and accessible via signed URL
- [ ] Proposal tracking: view count increments, status updates
- [ ] Stage change to "won": triggers tenant invite flow
- [ ] Follow-up overdue cron: marks as overdue, notifies assignee
- [ ] Lead merge: activities moved, duplicate soft-deleted
- [ ] Import: duplicate emails detected and skipped
- [ ] Weekly report: sent to all platform managers

**PM:**
- [ ] Private project: non-members cannot see via any query
- [ ] all_staff project: all active platform users can see (not edit)
- [ ] Task drag-drop: status updated, project progress recalculated
- [ ] Time log: own vs all access respected
- [ ] Sprint close: incomplete tasks moved to backlog
- [ ] GitHub webhook: signature verified before processing
- [ ] PR merged: linked task status → done
- [ ] Task due today: notifications sent at 8 AM EAT
- [ ] Mention in comment: mentioned user notified
- [ ] Template applied: correct number of tasks created with correct due dates

**Notifications:**
- [ ] Notification bell shows unread count
- [ ] Mark all read clears badge
- [ ] Deep link works (notification → correct page)
- [ ] Priority notifications styled differently (critical = red)
- [ ] Old notifications purged after 90 days

**Security:**
- [ ] Middleware blocks /platform without platform org membership
- [ ] Suspended users: WorkOS sessions revoked immediately
- [ ] All mutations check permissions (zero unguarded mutations)
- [ ] Soft delete: deleted records never returned in list queries
- [ ] DOMPurify: all rich text sanitized before storage
- [ ] Audit log: every sensitive action logged with before/after

---

*End of EduMyles Platform Systems Specification Supplement*
*Main spec: edumyles-platform-systems-spec.md*
*Combined: 7,500+ lines | April 2026*
