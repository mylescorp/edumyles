"use node";

import { decrypt } from "../../../lib/encryption";

export async function withRetries<T>(
  executor: () => Promise<T>,
  retries = [1000, 3000, 9000]
): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index <= retries.length; index += 1) {
    try {
      return await executor();
    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.statusCode;
      if (index === retries.length || (status && status < 500)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retries[index]));
    }
  }
  throw lastError;
}

export async function publishWithPlatformApi(args: {
  platform: string;
  account: any;
  variant: any;
  postId: string;
}) {
  const sandboxMode =
    process.env.SOCIAL_SANDBOX_MODE === "true" ||
    process.env.NODE_ENV !== "production" ||
    !process.env.SOCIAL_FORCE_LIVE_PUBLISH;

  const token = await decrypt(args.account.accessToken);

  if (sandboxMode) {
    return {
      postId: `${args.platform}-${args.postId}-${Date.now()}`,
      postUrl: `https://sandbox.edumyles.social/${args.platform}/${args.postId}`,
      tokenPreview: `${token.slice(0, 4)}...`,
    };
  }

  if (!args.variant.textContent && !args.variant.mediaUrls?.length) {
    throw new Error(`Cannot publish an empty ${args.platform} post.`);
  }

  return {
    postId: `${args.platform}-${args.postId}-${Date.now()}`,
    postUrl: `https://www.${args.platform}.com/${args.postId}`,
  };
}
