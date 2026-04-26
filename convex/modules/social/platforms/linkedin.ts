"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishLinkedInPost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "linkedin", ...args })
  );
}
