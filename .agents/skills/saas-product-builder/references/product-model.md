# Product Model Reference

Use this reference when designing modules, tenants, permissions, pricing, onboarding, or backend contracts for a new SaaS.

## Product Brief Fields

Capture these before or during implementation:

- Product name
- Category
- Primary buyer
- End users and roles
- Tenant/account unit
- Target region and currency
- Core jobs to be done
- Modules
- Pricing tiers
- Integrations
- Public acquisition channels
- Compliance or security requirements
- Launch proof: real customers, pilots, sample data, or waitlist only

## Tenancy

Default to multi-tenant:

- Every tenant-owned record includes `tenantId` or equivalent.
- Every product route resolves tenant/account context.
- Every query/mutation validates tenant membership.
- Platform admins are separated from tenant admins.
- Cross-tenant analytics are explicitly platform-scoped and guarded.

Use tenant naming that fits the domain:

- Clinics, practices, agencies, schools, teams, properties, merchants, organizations, projects, or workspaces.

## Roles

Model roles as product language, not generic labels. Typical layers:

- Platform owner/admin
- Tenant owner/admin
- Manager/operator
- Staff/contributor
- External customer/client/member
- Support or partner user

Each role should have:

- default access level
- allowed module features
- navigation entries
- dashboard widgets
- invite/accept flow
- notification defaults

## Modules

Treat modules as product capabilities that can be enabled, priced, configured, and permissioned.

Each module should define:

- slug
- display name
- version
- navigation entries
- dashboard widgets
- features
- default role access
- config schema
- notification definitions
- event subscriptions
- public API if needed
- install/uninstall hooks if module lifecycle exists

Use a small number of high-value modules first. A broad module catalog is fine for marketing, but the MVP should make one or two workflows excellent.

## Shared Public Catalog

Create shared constants for landing and product surfaces:

```ts
export type PublicPricingPlan = {
  key: "starter" | "professional" | "enterprise";
  name: string;
  tagline: string;
  monthlyPrice: number | null;
  annualMonthlyPrice: number | null;
  limitLabel: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
};
```

Also export public modules, public integrations, public personas, public comparison rows, and formatting helpers when multiple components use them.

## Onboarding

New tenant onboarding should collect:

- organization/account profile
- region, currency, timezone
- owner/admin details
- selected plan or trial
- selected modules
- initial data import needs
- communication sender settings
- payment/billing setup if required

After onboarding:

- create tenant
- create organization in auth provider if needed
- assign owner role
- initialize modules
- send welcome email
- route to dashboard with setup checklist
- log audit event

## Billing

Use plans tied to module availability and limits:

- Starter: single tenant/location, core records, basic communication, standard support.
- Professional: multi-location or higher volume, full modules, analytics, integrations, priority support.
- Enterprise: SSO, API, SLA, custom reporting, white-label, dedicated success, custom limits.

Billing state should influence product access but should not destroy data when a subscription changes. Prefer read-only, grace periods, or admin-only downgrade flows.

## Integrations

Choose integrations that unlock the product promise:

- Auth: WorkOS/AuthKit for SSO and organizations.
- Billing: Stripe.
- Email: Resend.
- SMS/WhatsApp/push: region-appropriate provider.
- Payments: Stripe plus local rails where relevant.
- Calendar/demo: Cal.com or equivalent.
- Analytics: PostHog or GA when needed.
- Observability: Sentry and Vercel Speed Insights.

Webhook handlers should verify signatures, be idempotent, and write audit/debug records for support.

## Forms And Public Intake

Public forms should validate with Zod and record attribution:

- waitlist
- demo request
- contact
- affiliate or reseller application
- referral tracking
- newsletter/changelog subscription

Store UTM parameters, referral code, landing path, user agent, and referrer where legally acceptable.

## Security

Include by default:

- tenant guards
- role checks
- module guards
- audit logging
- webhook signature checks
- server-side validation
- strict security headers
- no cross-tenant query helpers without explicit platform authorization
- no secret exposure to client bundles

For regulated domains, add domain-specific compliance tasks before launch.

