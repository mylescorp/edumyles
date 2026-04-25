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
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });
  },
});
