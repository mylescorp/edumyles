export type FrontendArtifactKind =
  | "page"
  | "api"
  | "layout"
  | "loading"
  | "error"
  | "not-found";

export type BackendEndpointKind =
  | "mutation"
  | "query"
  | "action"
  | "internalMutation"
  | "internalQuery"
  | "internalAction"
  | "httpAction";

export interface FrontendArtifact {
  id: string;
  kind: FrontendArtifactKind;
  routePath: string;
  area: string;
  family: string;
  moduleKey: string | null;
  sourcePath: string;
  relativePath: string;
  routeSegments: string[];
  isDynamic: boolean;
  isNavLinked: boolean;
  modifiedAt: string;
}

export interface BackendEndpoint {
  name: string;
  kind: BackendEndpointKind;
  signature: string;
}

export interface BackendArtifact {
  id: string;
  area: string;
  family: string;
  relativePath: string;
  sourcePath: string;
  endpointCount: number;
  endpoints: BackendEndpoint[];
  modifiedAt: string;
}

export interface DevSystemMapSummary {
  generatedAt: string;
  frontendArtifacts: number;
  frontendPages: number;
  landingPages: number;
  apiRoutes: number;
  layouts: number;
  backendFiles: number;
  backendEndpoints: number;
  panelCount: number;
  portalCount: number;
  moduleCount: number;
  navCoveragePercent: number;
}

export interface DevSystemMapCoverage {
  navRoutes: string[];
  missingFromNav: string[];
  navWithoutPage: string[];
}

export interface DevSystemMapTopologyGroup {
  key: string;
  label: string;
  count: number;
  routes: string[];
}

export interface DevTopologyFeature {
  id: string;
  title: string;
  routePath: string;
  launchPath: string | null;
  kind: FrontendArtifactKind;
  area: string;
  family: string;
  moduleKey: string | null;
  relativePath: string;
  isDynamic: boolean;
  isLaunchable: boolean;
  modifiedAt: string;
}

export interface DevTopologyBucket {
  key: string;
  label: string;
  kind: "panel" | "portal" | "module";
  featureCount: number;
  launchableFeatureCount: number;
  launchPath: string | null;
  features: DevTopologyFeature[];
}

export interface DevAuditEntry {
  id: string;
  title: string;
  scope: "frontend" | "backend" | "system";
  category: string;
  timestamp: string;
  summary: string;
  path?: string;
  routePath?: string;
  tenantName?: string;
  actorEmail?: string;
}

export interface DevRoleAccessSummary {
  role: string;
  label: string;
  dashboard: string;
  navItemCount: number;
  permissionCount: number;
  canAccessDevPanel: boolean;
  canRunPrivilegedDevActions: boolean;
}

export interface DevTenantSummary {
  tenantId: string;
  name: string;
  subdomain?: string;
  plan?: string;
  status?: string;
}

export interface DevTenantModule {
  moduleId: string;
  moduleSlug?: string;
  name?: string;
  category?: string;
  status?: string;
  installedAt?: number;
  updatedAt?: number;
  isInstalled: boolean;
}

export interface DevModuleCatalogItem {
  moduleId: string;
  name: string;
  category?: string;
  tier?: string;
  version?: string;
  isCore?: boolean;
  availableForTier?: boolean;
}

export interface DevImpersonationCandidate {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  recommended: boolean;
  tenantId: string;
  tenantName: string;
}

export interface DevPortalLauncher {
  role: string;
  label: string;
  dashboard: string;
  candidate: DevImpersonationCandidate | null;
}

export interface DevPrivilegedOpsData {
  selectedTenantId: string | null;
  tenants: DevTenantSummary[];
  moduleCatalog: DevModuleCatalogItem[];
  tenantModules: DevTenantModule[];
  impersonationCandidates: DevImpersonationCandidate[];
  portalLaunchers: DevPortalLauncher[];
}

export interface DevSystemMap {
  summary: DevSystemMapSummary;
  frontend: FrontendArtifact[];
  landing: FrontendArtifact[];
  backend: BackendArtifact[];
  coverage: DevSystemMapCoverage;
  panels: DevSystemMapTopologyGroup[];
  portals: DevSystemMapTopologyGroup[];
  modules: DevSystemMapTopologyGroup[];
  topology: DevTopologyBucket[];
  auditTrail: DevAuditEntry[];
  access: DevRoleAccessSummary[];
  smokeRoutes: string[];
}
