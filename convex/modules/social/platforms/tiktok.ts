"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishTikTokPost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "tiktok", ...args })
  );
}
