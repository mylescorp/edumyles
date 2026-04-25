"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishYouTubePost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "youtube", ...args })
  );
}
