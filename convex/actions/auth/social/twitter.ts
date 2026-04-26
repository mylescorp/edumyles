"use node";

import { internalAction } from "../../../_generated/server";
import { v } from "convex/values";
import { exchangeOAuthCode } from "./common";

export const exchangeCodeForAccount = internalAction({
  args: {
    platform: v.string(),
    code: v.string(),
    redirectUri: v.string(),
    state: v.string(),
  },
  handler: async (_ctx, args) => {
    return await exchangeOAuthCode({
      platform: args.platform,
      code: args.code,
      redirectUri: args.redirectUri,
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      extra: { code_verifier: args.state },
    });
  },
});
