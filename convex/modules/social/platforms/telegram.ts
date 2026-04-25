"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishTelegramPost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "telegram", ...args })
  );
}
