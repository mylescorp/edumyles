export * from "./publicApi";
export * from "./queries";
export * from "./mutations";
export * from "./features";
export * from "./configSchema";
export * from "./notifications";
export * from "./onInstall";
export * from "./onUninstall";
export * from "./eventHandlers";

import { MODULE_SPECS } from "../moduleCatalog";

export const MODULE_METADATA = MODULE_SPECS.mod_academics.metadata;
export const NAV_CONFIG = MODULE_SPECS.mod_academics.navConfig;
export const DASHBOARD_WIDGETS = MODULE_SPECS.mod_academics.dashboardWidgets;
