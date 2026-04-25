"use node";

import { publishWithPlatformApi, withRetries } from "./common";

export async function publishWhatsAppPost(args: { account: any; variant: any; postId: string }) {
  return await withRetries(() =>
    publishWithPlatformApi({ platform: "whatsapp", ...args })
  );
}
