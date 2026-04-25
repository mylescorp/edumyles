"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishInstagramPost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "instagram", ...args })
  );
}
