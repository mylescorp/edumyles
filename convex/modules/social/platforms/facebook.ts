"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishFacebookPost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "facebook", ...args })
  );
}
