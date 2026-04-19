export * from "./mutations";
export * from "./queries";
export * from "./publicApi";
export * from "./features";
export * from "./configSchema";
export * from "./notifications";
export * from "./onInstall";
export * from "./onUninstall";
export * from "./eventHandlers";

import { MODULE_SPECS } from "../moduleCatalog";

export const MODULE_METADATA = MODULE_SPECS.mod_communications.metadata;
export const NAV_CONFIG = MODULE_SPECS.mod_communications.navConfig;
export const DASHBOARD_WIDGETS = MODULE_SPECS.mod_communications.dashboardWidgets;
