export const SOCIAL_FEATURES = {
  create_posts: {
    key: "create_posts",
    label: "Create Posts",
    description: "Draft and submit social media posts for approval",
    defaultRoles: ["school_admin", "teacher"],
  },
  approve_posts: {
    key: "approve_posts",
    label: "Approve & Publish Posts",
    description: "Review, approve, reject, and directly publish posts",
    defaultRoles: ["school_admin"],
  },
  manage_accounts: {
    key: "manage_accounts",
    label: "Manage Connected Accounts",
    description: "Connect and disconnect social media accounts via OAuth",
    defaultRoles: ["school_admin"],
    riskyPermission: true,
  },
  view_analytics: {
    key: "view_analytics",
    label: "View Analytics",
    description: "View social analytics across all platforms",
    defaultRoles: ["school_admin", "principal"],
  },
  reply_comments: {
    key: "reply_comments",
    label: "Reply To Comments",
    description: "Reply to and manage comments across all platforms",
    defaultRoles: ["school_admin", "principal"],
  },
  manage_campaigns: {
    key: "manage_campaigns",
    label: "Manage Campaigns",
    description: "Create and manage social campaigns",
    defaultRoles: ["school_admin"],
  },
  manage_settings: {
    key: "manage_settings",
    label: "Manage Settings",
    description: "Configure approval workflows and posting schedules",
    defaultRoles: ["school_admin"],
  },
};

export const SOCIAL_DEFAULT_ROLE_ACCESS = [
  { role: "school_admin", accessLevel: "full", allowedFeatures: [] },
  { role: "principal", accessLevel: "restricted", allowedFeatures: ["view_analytics", "reply_comments", "view_social_dashboard"] },
  { role: "teacher", accessLevel: "restricted", allowedFeatures: ["create_posts", "view_social_dashboard"] },
  { role: "student", accessLevel: "none", allowedFeatures: [] },
  { role: "parent", accessLevel: "none", allowedFeatures: [] },
];
