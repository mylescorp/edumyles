/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_communications_email from "../actions/communications/email.js";
import type * as actions_communications_sms from "../actions/communications/sms.js";
import type * as actions_payments_mpesa from "../actions/payments/mpesa.js";
import type * as actions_payments_stripe from "../actions/payments/stripe.js";
import type * as helpers_auditLog from "../helpers/auditLog.js";
import type * as helpers_authorize from "../helpers/authorize.js";
import type * as helpers_idGenerator from "../helpers/idGenerator.js";
import type * as helpers_moduleGuard from "../helpers/moduleGuard.js";
import type * as helpers_tenantGuard from "../helpers/tenantGuard.js";
import type * as modules_academics_mutations from "../modules/academics/mutations.js";
import type * as modules_academics_queries from "../modules/academics/queries.js";
import type * as modules_admissions_mutations from "../modules/admissions/mutations.js";
import type * as modules_admissions_queries from "../modules/admissions/queries.js";
import type * as modules_communications_mutations from "../modules/communications/mutations.js";
import type * as modules_communications_queries from "../modules/communications/queries.js";
import type * as modules_ecommerce_mutations from "../modules/ecommerce/mutations.js";
import type * as modules_ecommerce_queries from "../modules/ecommerce/queries.js";
import type * as modules_ewallet_mutations from "../modules/ewallet/mutations.js";
import type * as modules_ewallet_queries from "../modules/ewallet/queries.js";
import type * as modules_finance_mutations from "../modules/finance/mutations.js";
import type * as modules_finance_queries from "../modules/finance/queries.js";
import type * as modules_hr_mutations from "../modules/hr/mutations.js";
import type * as modules_hr_queries from "../modules/hr/queries.js";
import type * as modules_library_mutations from "../modules/library/mutations.js";
import type * as modules_library_queries from "../modules/library/queries.js";
import type * as modules_marketplace_mutations from "../modules/marketplace/mutations.js";
import type * as modules_marketplace_platform from "../modules/marketplace/platform.js";
import type * as modules_marketplace_queries from "../modules/marketplace/queries.js";
import type * as modules_marketplace_tierModules from "../modules/marketplace/tierModules.js";
import type * as modules_portal_alumni_mutations from "../modules/portal/alumni/mutations.js";
import type * as modules_portal_alumni_queries from "../modules/portal/alumni/queries.js";
import type * as modules_portal_parent_mutations from "../modules/portal/parent/mutations.js";
import type * as modules_portal_parent_queries from "../modules/portal/parent/queries.js";
import type * as modules_portal_partner_mutations from "../modules/portal/partner/mutations.js";
import type * as modules_portal_partner_queries from "../modules/portal/partner/queries.js";
import type * as modules_portal_student_mutations from "../modules/portal/student/mutations.js";
import type * as modules_portal_student_queries from "../modules/portal/student/queries.js";
import type * as modules_sis_mutations from "../modules/sis/mutations.js";
import type * as modules_sis_queries from "../modules/sis/queries.js";
import type * as modules_timetable_mutations from "../modules/timetable/mutations.js";
import type * as modules_timetable_queries from "../modules/timetable/queries.js";
import type * as modules_transport_mutations from "../modules/transport/mutations.js";
import type * as modules_transport_queries from "../modules/transport/queries.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as platform_analytics_mutations from "../platform/analytics/mutations.js";
import type * as platform_analytics_queries from "../platform/analytics/queries.js";
import type * as platform_audit_queries from "../platform/audit/queries.js";
import type * as platform_billing_mutations from "../platform/billing/mutations.js";
import type * as platform_billing_queries from "../platform/billing/queries.js";
import type * as platform_impersonation_mutations from "../platform/impersonation/mutations.js";
import type * as platform_impersonation_queries from "../platform/impersonation/queries.js";
import type * as platform_marketplace_mutations from "../platform/marketplace/mutations.js";
import type * as platform_marketplace_queries from "../platform/marketplace/queries.js";
import type * as platform_marketplace_payments from "../platform/marketplace/payments.js";
import type * as platform_operations_mutations from "../platform/operations/mutations.js";
import type * as platform_operations_queries from "../platform/operations/queries.js";
import type * as platform_tenants_mutations from "../platform/tenants/mutations.js";
import type * as platform_tenants_queries from "../platform/tenants/queries.js";
import type * as platform_users_mutations from "../platform/users/mutations.js";
import type * as platform_users_queries from "../platform/users/queries.js";
import type * as sessions from "../sessions.js";
import type * as tenants from "../tenants.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/communications/email": typeof actions_communications_email;
  "actions/communications/sms": typeof actions_communications_sms;
  "actions/payments/mpesa": typeof actions_payments_mpesa;
  "actions/payments/stripe": typeof actions_payments_stripe;
  "helpers/auditLog": typeof helpers_auditLog;
  "helpers/authorize": typeof helpers_authorize;
  "helpers/idGenerator": typeof helpers_idGenerator;
  "helpers/moduleGuard": typeof helpers_moduleGuard;
  "helpers/tenantGuard": typeof helpers_tenantGuard;
  "modules/academics/mutations": typeof modules_academics_mutations;
  "modules/academics/queries": typeof modules_academics_queries;
  "modules/admissions/mutations": typeof modules_admissions_mutations;
  "modules/admissions/queries": typeof modules_admissions_queries;
  "modules/communications/mutations": typeof modules_communications_mutations;
  "modules/communications/queries": typeof modules_communications_queries;
  "modules/ecommerce/mutations": typeof modules_ecommerce_mutations;
  "modules/ecommerce/queries": typeof modules_ecommerce_queries;
  "modules/ewallet/mutations": typeof modules_ewallet_mutations;
  "modules/ewallet/queries": typeof modules_ewallet_queries;
  "modules/finance/mutations": typeof modules_finance_mutations;
  "modules/finance/queries": typeof modules_finance_queries;
  "modules/hr/mutations": typeof modules_hr_mutations;
  "modules/hr/queries": typeof modules_hr_queries;
  "modules/library/mutations": typeof modules_library_mutations;
  "modules/library/queries": typeof modules_library_queries;
  "modules/marketplace/mutations": typeof modules_marketplace_mutations;
  "modules/marketplace/platform": typeof modules_marketplace_platform;
  "modules/marketplace/queries": typeof modules_marketplace_queries;
  "modules/marketplace/tierModules": typeof modules_marketplace_tierModules;
  "modules/portal/alumni/mutations": typeof modules_portal_alumni_mutations;
  "modules/portal/alumni/queries": typeof modules_portal_alumni_queries;
  "modules/portal/parent/mutations": typeof modules_portal_parent_mutations;
  "modules/portal/parent/queries": typeof modules_portal_parent_queries;
  "modules/portal/partner/mutations": typeof modules_portal_partner_mutations;
  "modules/portal/partner/queries": typeof modules_portal_partner_queries;
  "modules/portal/student/mutations": typeof modules_portal_student_mutations;
  "modules/portal/student/queries": typeof modules_portal_student_queries;
  "modules/sis/mutations": typeof modules_sis_mutations;
  "modules/sis/queries": typeof modules_sis_queries;
  "modules/timetable/mutations": typeof modules_timetable_mutations;
  "modules/timetable/queries": typeof modules_timetable_queries;
  "modules/transport/mutations": typeof modules_transport_mutations;
  "modules/transport/queries": typeof modules_transport_queries;
  notifications: typeof notifications;
  organizations: typeof organizations;
  "platform/analytics/mutations": typeof platform_analytics_mutations;
  "platform/analytics/queries": typeof platform_analytics_queries;
  "platform/audit/queries": typeof platform_audit_queries;
  "platform/billing/mutations": typeof platform_billing_mutations;
  "platform/billing/queries": typeof platform_billing_queries;
  "platform/impersonation/mutations": typeof platform_impersonation_mutations;
  "platform/impersonation/queries": typeof platform_impersonation_queries;
  "platform/marketplace/mutations": typeof platform_marketplace_mutations;
  "platform/marketplace/queries": typeof platform_marketplace_queries;
  "platform/marketplace/payments": typeof platform_marketplace_payments;
  "platform/operations/mutations": typeof platform_operations_mutations;
  "platform/operations/queries": typeof platform_operations_queries;
  "platform/tenants/mutations": typeof platform_tenants_mutations;
  "platform/tenants/queries": typeof platform_tenants_queries;
  "platform/users/mutations": typeof platform_users_mutations;
  "platform/users/queries": typeof platform_users_queries;
  sessions: typeof sessions;
  tenants: typeof tenants;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
