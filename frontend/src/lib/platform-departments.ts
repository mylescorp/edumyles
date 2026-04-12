export type PlatformDepartment = {
  value: string;
  label: string;
  description: string;
};

export const PLATFORM_DEPARTMENTS: PlatformDepartment[] = [
  {
    value: "executive_leadership",
    label: "Executive Leadership",
    description: "Company direction, approvals, and platform governance.",
  },
  {
    value: "tenant_success",
    label: "Tenant Success",
    description: "Customer retention, account health, and adoption support.",
  },
  {
    value: "onboarding_implementation",
    label: "Onboarding & Implementation",
    description: "School setup, rollout planning, and launch coordination.",
  },
  {
    value: "user_administration",
    label: "User Administration",
    description: "Platform staff access, roles, sessions, and policy controls.",
  },
  {
    value: "platform_operations",
    label: "Platform Operations",
    description: "Operational oversight, incidents, SLAs, and service readiness.",
  },
  {
    value: "support_experience",
    label: "Support Experience",
    description: "Ticket handling, escalations, and knowledge base quality.",
  },
  {
    value: "security_compliance",
    label: "Security & Compliance",
    description: "Audit readiness, API security, access reviews, and trust.",
  },
  {
    value: "billing_revenue",
    label: "Billing & Revenue",
    description: "Plans, subscriptions, invoices, collections, and payouts.",
  },
  {
    value: "crm_sales",
    label: "CRM & Sales",
    description: "Lead pipeline, proposals, and commercial conversion workflows.",
  },
  {
    value: "marketplace_partnerships",
    label: "Marketplace & Partnerships",
    description: "Modules, publishers, partner relationships, and moderation.",
  },
  {
    value: "reseller_affiliate_programs",
    label: "Reseller & Affiliate Programs",
    description: "Channel growth, referrals, reseller reviews, and partner ops.",
  },
  {
    value: "developer_relations",
    label: "Developer Relations",
    description: "Developer portal health, integrations, and publisher support.",
  },
  {
    value: "communications_brand",
    label: "Communications & Brand",
    description: "Broadcasts, announcements, campaigns, and messaging standards.",
  },
  {
    value: "analytics_reporting",
    label: "Analytics & Reporting",
    description: "Insights, scheduled reports, forecasting, and KPI tracking.",
  },
  {
    value: "project_management",
    label: "Project Management",
    description: "Execution planning, delivery tracking, and cross-team coordination.",
  },
  {
    value: "product_engineering",
    label: "Product & Engineering",
    description: "Platform roadmap, technical operations, and systems delivery.",
  },
];

export const PLATFORM_DEPARTMENT_BY_VALUE = Object.fromEntries(
  PLATFORM_DEPARTMENTS.map((department) => [department.value, department])
);
