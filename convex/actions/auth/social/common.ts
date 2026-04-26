"use node";

export async function exchangeOAuthCode(args: {
  platform: string;
  code: string;
  redirectUri: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  extra?: Record<string, string>;
}) {
  const sandboxMode =
    process.env.SOCIAL_SANDBOX_MODE === "true" ||
    !args.clientId ||
    !args.clientSecret;

  if (sandboxMode) {
    return {
      tokens: {
        accessToken: `sandbox-${args.platform}-${args.code}`,
        refreshToken: `sandbox-refresh-${args.platform}`,
        expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
      },
      account: {
        id: `${args.platform}-${Math.abs(hashCode(args.code))}`,
        name: `${capitalize(args.platform)} Sandbox Account`,
        handle: `@sandbox_${args.platform}`,
        profileImageUrl: undefined,
        followerCount: 0,
        followingCount: 0,
        type: "business",
      },
    };
  }

  const response = await fetch(args.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(
      Object.entries({
        code: args.code,
        redirect_uri: args.redirectUri,
        client_id: args.clientId,
        client_secret: args.clientSecret,
        grant_type: "authorization_code",
        ...(args.extra ?? {}),
      }).reduce<Record<string, string>>((accumulator, [key, value]) => {
        if (value !== undefined) {
          accumulator[key] = value;
        }
        return accumulator;
      }, {})
    ),
  });

  const json: any = await response.json();
  if (!response.ok) {
    throw new Error(json?.error_description ?? json?.error ?? `Failed to exchange ${args.platform} OAuth code.`);
  }

  return {
    tokens: {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: json.expires_in ? Date.now() + Number(json.expires_in) * 1000 : undefined,
      pageToken: json.page_token,
    },
    account: {
      id: `${args.platform}-${Math.abs(hashCode(json.access_token ?? args.code))}`,
      name: `${capitalize(args.platform)} Account`,
      handle: json.username ? `@${json.username}` : `@${args.platform}`,
      profileImageUrl: undefined,
      followerCount: undefined,
      followingCount: undefined,
      type: "business",
    },
  };
}

function hashCode(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function capitalize(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
