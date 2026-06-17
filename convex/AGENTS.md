# convex

## Purpose

Convex backend for EduMyles: schema, functions, actions, modules, cron jobs, helpers, and HTTP/webhook surfaces.

## Ownership

- Product owner: Myles.
- Backend changes affect all app surfaces and tenant data.

## Local Contracts

- Every function must authenticate first, then check role, then scope by tenant before business logic.
- Every tenant-scoped table must include tenant indexes.
- Soft delete with `deletedAt`; do not hard delete records unless Myles explicitly approves.
- Full input validation is required on every mutation and action.
- Do not expose provider names, internal function names, stack traces, file paths, or raw system errors to users.

## Work Guidance

- Build backend contracts before UI that depends on them.
- Keep generated `_generated/` files out of manual edits.
- Update this DOX file when modules, action families, or backend conventions change.

## Verification

- Run the repository typecheck and lint gates when backend code changes.
- Test valid, invalid, and wrong-tenant cases before UI wiring.

## Child DOX Index

- `actions/`: external service actions and async workflows.
- `emails/`: email templates and email helpers.
- `helpers/`: backend helper functions.
- `lib/`: shared backend utilities.
- `modules/`: domain modules for school operations.
- `platform/`: platform-level master admin functions.
