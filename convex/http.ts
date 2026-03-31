import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authKit } from "./auth";

const http = httpRouter();

// Register WorkOS webhook routes:
//  POST /workos/webhook  — receives user.created / user.updated / user.deleted events
authKit.registerRoutes(http);

/**
 * GET /security/blocked-ips
 * Returns the list of currently-active blocked IP addresses (platform-wide).
 * Used by Next.js middleware for edge-level IP blocking enforcement.
 * Response is cache-friendly (60 s) to keep Convex read counts low.
 */
http.route({
  path: "/security/blocked-ips",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const now = Date.now();
    const ips: string[] = await ctx.runQuery(
      internal.platform.security.queries.listAllBlockedIPsInternal,
      { now }
    );

    return new Response(JSON.stringify({ ips, cachedAt: now }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

export default http;
