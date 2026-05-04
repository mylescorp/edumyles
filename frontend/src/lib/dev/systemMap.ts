import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  DevAuditEntry,
  BackendArtifact,
  BackendEndpoint,
  BackendEndpointKind,
  DevSystemMap,
  DevRoleAccessSummary,
  DevTopologyBucket,
  DevTopologyFeature,
  DevSystemMapTopologyGroup,
  FrontendArtifact,
  FrontendArtifactKind,
} from "./types";
import { canAccessDevPanel, canRunPrivilegedDevActions } from "./access";
import { ROLE_PERMISSIONS, type Role } from "../permissions";
import { getNavItemsForRole, getRoleDashboard, getRoleLabel } from "../routes";

const FRONTEND_ROOT = process.cwd();
const PROJECT_ROOT = path.resolve(FRONTEND_ROOT, "..");
const APP_ROOT = path.join(FRONTEND_ROOT, "src", "app");
const LANDING_ROOT = path.join(PROJECT_ROOT, "landing");
const LANDING_APP_ROOT = path.join(LANDING_ROOT, "src", "app");
const CONVEX_ROOT = path.join(PROJECT_ROOT, "convex");
const ROUTES_FILE = path.join(FRONTEND_ROOT, "src", "lib", "routes.ts");

const APP_FILE_MAP: Record<string, FrontendArtifactKind> = {
  "page.tsx": "page",
  "route.ts": "api",
  "layout.tsx": "layout",
  "loading.tsx": "loading",
  "error.tsx": "error",
  "not-found.tsx": "not-found",
};

const CONVEX_FILE_EXCLUDES = new Set(["_generated", "node_modules"]);
const MODULE_SEGMENTS = new Set([
  "academics",
  "admissions",
  "ai-support",
  "analytics",
  "communications",
  "crm",
  "ewallet",
  "finance",
  "library",
  "marketplace",
  "pm",
  "security",
  "sis",
  "social",
  "support",
  "tickets",
  "timetable",
  "transport",
  "users",
  "waitlist",
]);

function normalizeSlashes(value: string) {
  return value.replace(/\\/g, "/");
}

function titleize(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function cleanSegments(segments: string[]) {
  return segments.filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("@"));
}

function toRoutePath(segments: string[]) {
  const clean = cleanSegments(segments);
  return clean.length ? `/${clean.join("/")}` : "/";
}

function inferArea(segments: string[]) {
  const [first, second] = cleanSegments(segments);
  if (!first) return "root";
  if (first === "portal" && second) return `portal:${second}`;
  if (first === "api" && second) return `api:${second}`;
  return first;
}

function inferFamily(segments: string[]) {
  const clean = cleanSegments(segments);
  if (!clean.length) return "root";
  if (clean[0] === "portal") return clean.slice(0, 2).join("/");
  if (clean[0] === "api") return clean.slice(0, 2).join("/");
  return clean.slice(0, Math.min(clean.length, 2)).join("/");
}

function inferModuleKey(segments: string[]) {
  const clean = cleanSegments(segments);
  for (const segment of clean) {
    if (MODULE_SEGMENTS.has(segment)) {
      return segment;
    }
  }
  return null;
}

async function walk(dir: string, visitor: (filePath: string) => Promise<void> | void) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, visitor);
        return;
      }
      await visitor(fullPath);
    })
  );
}

async function readNavRoutes() {
  const source = await fs.readFile(ROUTES_FILE, "utf8");
  const matches = source.matchAll(/href:\s*"([^"]+)"/g);
  const routes = Array.from(matches, (match) => match[1]).filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
  return [...new Set(routes)].sort();
}

async function scanFrontend(navRoutes: Set<string>) {
  const artifacts: FrontendArtifact[] = [];

  await walk(APP_ROOT, async (filePath) => {
    const baseName = path.basename(filePath);
    const kind = APP_FILE_MAP[baseName];
    if (!kind) return;
    const stats = await fs.stat(filePath);

    const relativePath = normalizeSlashes(path.relative(FRONTEND_ROOT, filePath));
    const routeDir = path.dirname(path.relative(APP_ROOT, filePath));
    const routeSegments = routeDir === "." ? [] : routeDir.split(path.sep);
    const routePath = toRoutePath(routeSegments);

    artifacts.push({
      id: `${kind}:${routePath}:${relativePath}`,
      kind,
      routePath,
      area: inferArea(routeSegments),
      family: inferFamily(routeSegments),
      moduleKey: inferModuleKey(routeSegments),
      sourcePath: normalizeSlashes(filePath),
      relativePath,
      routeSegments: cleanSegments(routeSegments),
      isDynamic: routeSegments.some((segment) => segment.startsWith("[")),
      isNavLinked: kind === "page" ? navRoutes.has(routePath) : false,
      modifiedAt: stats.mtime.toISOString(),
    });
  });

  return artifacts.sort((a, b) => a.routePath.localeCompare(b.routePath) || a.kind.localeCompare(b.kind));
}

async function scanLandingPages() {
  const artifacts: FrontendArtifact[] = [];

  await walk(LANDING_APP_ROOT, async (filePath) => {
    if (path.basename(filePath) !== "page.tsx") return;
    const stats = await fs.stat(filePath);

    const relativePath = normalizeSlashes(path.relative(PROJECT_ROOT, filePath));
    const routeDir = path.dirname(path.relative(LANDING_APP_ROOT, filePath));
    const routeSegments = routeDir === "." ? [] : routeDir.split(path.sep);
    const routePath = toRoutePath(routeSegments);
    const cleanRouteSegments = cleanSegments(routeSegments);
    const topLevelSegment = cleanRouteSegments[0] ?? "home";

    artifacts.push({
      id: `landing:page:${routePath}:${relativePath}`,
      kind: "page",
      routePath,
      area: `landing:${topLevelSegment}`,
      family: `landing/${topLevelSegment}`,
      moduleKey: null,
      sourcePath: normalizeSlashes(filePath),
      relativePath,
      routeSegments: cleanRouteSegments,
      isDynamic: routeSegments.some((segment) => segment.startsWith("[")),
      isNavLinked: false,
      modifiedAt: stats.mtime.toISOString(),
    });
  });

  return artifacts.sort((a, b) => a.routePath.localeCompare(b.routePath));
}

function extractBackendEndpoints(source: string): BackendEndpoint[] {
  const matches = source.matchAll(
    /export const (\w+)\s*=\s*(mutation|query|action|internalMutation|internalQuery|internalAction|httpAction)\s*\(/g
  );

  return Array.from(matches, (match) => {
    const name = match[1];
    const kind = match[2] as BackendEndpointKind | undefined;
    if (!name || !kind) {
      return null;
    }
    return {
      name,
      kind,
      signature: `${kind} ${name}`,
    };
  }).filter((endpoint): endpoint is BackendEndpoint => endpoint !== null);
}

async function scanBackend() {
  const artifacts: BackendArtifact[] = [];

  await walk(CONVEX_ROOT, async (filePath) => {
    if (!filePath.endsWith(".ts")) return;
    const relativeSegments = path.relative(CONVEX_ROOT, filePath).split(path.sep);
    if (relativeSegments.some((segment) => CONVEX_FILE_EXCLUDES.has(segment))) return;

    const source = await fs.readFile(filePath, "utf8");
    const stats = await fs.stat(filePath);
    const endpoints = extractBackendEndpoints(source);
    const relativePath = normalizeSlashes(path.relative(PROJECT_ROOT, filePath));
    const cleanPath = normalizeSlashes(path.relative(CONVEX_ROOT, filePath)).replace(/\.ts$/, "");
    const pathSegments = cleanPath.split("/");

    artifacts.push({
      id: cleanPath,
      area: pathSegments[0] ?? "root",
      family: pathSegments.slice(0, Math.min(pathSegments.length, 2)).join("/") || "root",
      relativePath,
      sourcePath: normalizeSlashes(filePath),
      endpointCount: endpoints.length,
      endpoints,
      modifiedAt: stats.mtime.toISOString(),
    });
  });

  return artifacts.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function buildTopologyGroups(
  items: FrontendArtifact[],
  groupBy: (item: FrontendArtifact) => string | null
): DevSystemMapTopologyGroup[] {
  const grouped = new Map<string, string[]>();

  for (const item of items) {
    const key = groupBy(item);
    if (!key) continue;
    const existing = grouped.get(key) ?? [];
    existing.push(item.routePath);
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries())
    .map(([key, routes]) => ({
      key,
      label: titleize(key.replace(/^portal:/, "").replace(/^api:/, "")),
      count: new Set(routes).size,
      routes: [...new Set(routes)].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function buildCoverage(frontend: FrontendArtifact[], navRoutes: string[]) {
  const pageRoutes = new Set(
    frontend
      .filter((item) => item.kind === "page")
      .map((item) => item.routePath)
  );

  const missingFromNav = [...pageRoutes]
    .filter((routePath) => {
      if (navRoutes.includes(routePath)) return false;
      if (routePath === "/" || routePath.startsWith("/dev")) return false;
      if (routePath.startsWith("/auth") || routePath.startsWith("/api")) return false;
      if (routePath.includes("[")) return false;
      return true;
    })
    .sort();

  const navWithoutPage = navRoutes
    .filter((routePath) => !pageRoutes.has(routePath))
    .sort();

  return {
    navRoutes,
    missingFromNav,
    navWithoutPage,
  };
}

function toTopologyFeature(item: FrontendArtifact): DevTopologyFeature {
  const title = item.routePath === "/" ? "Root" : item.routePath.split("/").filter(Boolean).at(-1) ?? item.routePath;
  const isLaunchable = item.kind === "page" && !item.isDynamic;

  return {
    id: item.id,
    title: titleize(title),
    routePath: item.routePath,
    launchPath: isLaunchable ? item.routePath : null,
    kind: item.kind,
    area: item.area,
    family: item.family,
    moduleKey: item.moduleKey,
    relativePath: item.relativePath,
    isDynamic: item.isDynamic,
    isLaunchable,
    modifiedAt: item.modifiedAt,
  };
}

function pickTopologyLaunchPath(items: FrontendArtifact[]) {
  const launchablePages = items
    .filter((item) => item.kind === "page" && !item.isDynamic)
    .sort((left, right) => {
      const segmentDelta = left.routeSegments.length - right.routeSegments.length;
      if (segmentDelta !== 0) return segmentDelta;
      return left.routePath.localeCompare(right.routePath);
    });

  return launchablePages[0]?.routePath ?? null;
}

function buildDetailedTopology(frontend: FrontendArtifact[]): DevTopologyBucket[] {
  const buildBuckets = (
    kind: DevTopologyBucket["kind"],
    items: FrontendArtifact[],
    groupBy: (item: FrontendArtifact) => string | null
  ) => {
    const grouped = new Map<string, FrontendArtifact[]>();

    for (const item of items) {
      const key = groupBy(item);
      if (!key) continue;
      const existing = grouped.get(key) ?? [];
      existing.push(item);
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries()).map(([key, value]) => {
      const features = value
        .slice()
        .sort((left, right) =>
          left.routePath.localeCompare(right.routePath) ||
          left.kind.localeCompare(right.kind)
        )
        .map(toTopologyFeature);

      return {
        key,
        label: titleize(key.replace(/^portal:/, "").replace(/^api:/, "")),
        kind,
        featureCount: value.length,
        launchableFeatureCount: features.filter((feature) => feature.isLaunchable).length,
        launchPath: pickTopologyLaunchPath(value),
        features,
      };
    });
  };

  const panelBuckets = buildBuckets("panel", frontend, (item) => {
    if (item.area === "platform") return "platform";
    if (item.area === "admin" || item.family === "portal/admin") return "admin";
    if (item.area === "dev") return "dev";
    if (item.area === "support") return "support";
    return null;
  });

  const portalBuckets = buildBuckets("portal", frontend, (item) =>
    item.area.startsWith("portal:") ? item.area : null
  );

  const moduleBuckets = buildBuckets("module", frontend.filter((item) => item.moduleKey), (item) =>
    item.moduleKey ?? null
  );

  return [...panelBuckets, ...portalBuckets, ...moduleBuckets].sort(
    (left, right) =>
      left.kind.localeCompare(right.kind) ||
      right.featureCount - left.featureCount ||
      left.label.localeCompare(right.label)
  );
}

function buildAuditTrail(frontend: FrontendArtifact[], backend: BackendArtifact[]): DevAuditEntry[] {
  const frontendEntries: DevAuditEntry[] = frontend.map((item) => ({
    id: `frontend:${item.id}`,
    title: `${item.kind} ${item.routePath}`,
    scope: "frontend",
    category: item.area,
    timestamp: item.modifiedAt,
    summary: `${item.relativePath}${item.moduleKey ? ` • module ${item.moduleKey}` : ""}`,
    path: item.relativePath,
    routePath: item.routePath,
  }));

  const backendEntries: DevAuditEntry[] = backend.map((item) => ({
    id: `backend:${item.id}`,
    title: item.family,
    scope: "backend",
    category: item.area,
    timestamp: item.modifiedAt,
    summary: `${item.endpointCount} endpoints • ${item.relativePath}`,
    path: item.relativePath,
  }));

  const systemEntries: DevAuditEntry[] = [
    {
      id: "system:scan",
      title: "Developer system map generated",
      scope: "system",
      category: "scan",
      timestamp: new Date().toISOString(),
      summary: "Filesystem scan completed for frontend routes and Convex backend.",
    },
  ];

  return [...systemEntries, ...frontendEntries, ...backendEntries]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 80);
}

function buildSmokeRoutes(frontend: FrontendArtifact[]) {
  const preferredPrefixes = [
    "/platform",
    "/portal/admin",
    "/portal/student",
    "/portal/teacher",
    "/portal/parent",
    "/portal/developer",
    "/admin",
    "/support",
  ];

  const staticPages = frontend.filter((item) => item.kind === "page" && !item.isDynamic);
  const picked = new Set<string>();

  for (const prefix of preferredPrefixes) {
    const match = staticPages.find((item) => item.routePath === prefix || item.routePath.startsWith(`${prefix}/`));
    if (match) picked.add(match.routePath);
  }

  for (const item of staticPages) {
    if (picked.size >= 24) break;
    picked.add(item.routePath);
  }

  return [...picked];
}

function buildRoleAccessSummaries(): DevRoleAccessSummary[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[])
    .map((role) => ({
      role,
      label: getRoleLabel(role),
      dashboard: getRoleDashboard(role),
      navItemCount: getNavItemsForRole(role).length,
      permissionCount: ROLE_PERMISSIONS[role].length,
      canAccessDevPanel: canAccessDevPanel(role),
      canRunPrivilegedDevActions: canRunPrivilegedDevActions(role),
    }))
    .sort((a, b) => {
      if (a.canAccessDevPanel !== b.canAccessDevPanel) {
        return a.canAccessDevPanel ? -1 : 1;
      }
      return b.permissionCount - a.permissionCount || a.label.localeCompare(b.label);
    });
}

export async function buildDevSystemMap(): Promise<DevSystemMap> {
  const navRoutes = await readNavRoutes();
  const frontend = await scanFrontend(new Set(navRoutes));
  const landing = await scanLandingPages();
  const backend = await scanBackend();
  const coverage = buildCoverage(frontend, navRoutes);
  const pageArtifacts = frontend.filter((item) => item.kind === "page");
  const apiArtifacts = frontend.filter((item) => item.kind === "api");
  const layoutArtifacts = frontend.filter((item) => item.kind === "layout");
  const backendEndpointCount = backend.reduce((total, item) => total + item.endpointCount, 0);

  const panels = buildTopologyGroups(pageArtifacts, (item) => {
    if (item.area === "platform") return "platform";
    if (item.area === "admin" || item.family === "portal/admin") return "admin";
    if (item.area === "dev") return "dev";
    if (item.area === "support") return "support";
    return null;
  });
  const portals = buildTopologyGroups(pageArtifacts, (item) => (item.area.startsWith("portal:") ? item.area : null));
  const modules = buildTopologyGroups(
    pageArtifacts.filter((item) => item.moduleKey),
    (item) => item.moduleKey ?? null
  );
  const navCoveragePercent = navRoutes.length
    ? Math.round(((navRoutes.length - coverage.navWithoutPage.length) / navRoutes.length) * 100)
    : 100;

  return {
    summary: {
      generatedAt: new Date().toISOString(),
      frontendArtifacts: frontend.length,
      frontendPages: pageArtifacts.length,
      landingPages: landing.length,
      apiRoutes: apiArtifacts.length,
      layouts: layoutArtifacts.length,
      backendFiles: backend.length,
      backendEndpoints: backendEndpointCount,
      panelCount: panels.length,
      portalCount: portals.length,
      moduleCount: modules.length,
      navCoveragePercent,
    },
    frontend,
    landing,
    backend,
    coverage,
    panels,
    portals,
    modules,
    topology: buildDetailedTopology(frontend),
    auditTrail: buildAuditTrail(frontend, backend),
    access: buildRoleAccessSummaries(),
    smokeRoutes: buildSmokeRoutes(frontend),
  };
}
