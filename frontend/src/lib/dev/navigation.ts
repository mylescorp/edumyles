import {
  Code2,
  Database,
  FileCode2,
  Gauge,
  GitBranch,
  Globe2,
  History,
  LayoutDashboard,
  Network,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface DevConsoleNavItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export const DEV_CONSOLE_NAV: DevConsoleNavItem[] = [
  {
    title: "Overview",
    href: "/dev",
    description: "System-wide live map",
    icon: LayoutDashboard,
  },
  {
    title: "Frontend",
    href: "/dev/frontend",
    description: "Pages, layouts, routes",
    icon: FileCode2,
  },
  {
    title: "Landing",
    href: "/dev/landing",
    description: "Marketing pages",
    icon: Globe2,
  },
  {
    title: "Backend",
    href: "/dev/backend",
    description: "Convex endpoints and files",
    icon: Database,
  },
  {
    title: "Coverage",
    href: "/dev/coverage",
    description: "Nav gaps and hidden pages",
    icon: Gauge,
  },
  {
    title: "Topology",
    href: "/dev/topology",
    description: "Panels, portals, modules",
    icon: Network,
  },
  {
    title: "Access",
    href: "/dev/access",
    description: "Role visibility matrix",
    icon: ShieldCheck,
  },
  {
    title: "Operations",
    href: "/dev/operations",
    description: "Tenant tools and launchers",
    icon: Code2,
  },
  {
    title: "Audit",
    href: "/dev/audit",
    description: "Timestamped dev trail",
    icon: History,
  },
  {
    title: "Testing",
    href: "/dev/testing",
    description: "Smoke suites and route lab",
    icon: GitBranch,
  },
];
