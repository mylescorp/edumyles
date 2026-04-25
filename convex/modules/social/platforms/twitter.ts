"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishTwitterPost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "twitter", ...args })
  );
}
