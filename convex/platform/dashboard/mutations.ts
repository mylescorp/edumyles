// The platform dashboard is a read-only aggregation surface. It derives all of its
// data from existing tables (tenants, tickets, auditLogs) via queries.ts and
// therefore has no write operations of its own.
//
// If interactive dashboard features are added in the future (e.g. pinning widgets,
// saving custom time-range preferences, or dismissing activity feed items), add
// mutations here following the pattern in convex/platform/health/mutations.ts.
