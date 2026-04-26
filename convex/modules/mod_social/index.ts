export const MODULE_METADATA = {
  slug: "mod_social",
  name: "Social Media Management",
  version: "1.0.0",
  category: "Communications",
  description:
    "Manage all school social media accounts from EduMyles. Create, schedule, approve, publish, and review analytics in one place.",
  tagline: "One dashboard. All platforms. Zero context-switching.",
  minimumPlan: "starter",
  dependencies: ["core_sis", "core_notifications"],
  baseRateKes: 15,
};

export const NAV_CONFIG = {
  moduleSlug: "mod_social",
  adminNav: [
    {
      label: "Social Media",
      icon: "Share2",
      href: "/admin/social",
      children: [
        { label: "Dashboard", href: "/admin/social" },
        { label: "Create Post", href: "/admin/social/posts/create", requiredFeature: "create_posts" },
        { label: "All Posts", href: "/admin/social/posts" },
        { label: "Content Calendar", href: "/admin/social/calendar" },
        { label: "Comments", href: "/admin/social/comments" },
        { label: "Analytics", href: "/admin/social/analytics", requiredFeature: "view_analytics" },
        { label: "Campaigns", href: "/admin/social/campaigns" },
        { label: "Media Library", href: "/admin/social/library" },
        { label: "Connected Accounts", href: "/admin/social/accounts", requiredFeature: "manage_accounts" },
        { label: "Settings", href: "/admin/social/settings", requiredFeature: "manage_settings" },
      ],
    },
  ],
  teacherNav: [
    {
      label: "Social Media",
      icon: "Share2",
      href: "/portal/teacher/social/create",
      children: [
        { label: "Create Draft", href: "/portal/teacher/social/create", requiredFeature: "create_posts" },
        { label: "My Drafts", href: "/portal/teacher/social/status" },
      ],
    },
  ],
  dashboardWidgets: [
    { widgetId: "social_pending_approval", size: "small", defaultOrder: 8 },
    { widgetId: "social_quick_stats", size: "medium", defaultOrder: 9 },
  ],
};
