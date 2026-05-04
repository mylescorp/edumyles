type DomainProvisionResult =
  | { configured: false; reason: string }
  | { configured: true; hostname: string; status: "created" | "exists" | "skipped" };

function getVercelDomainConfig() {
  return {
    token: process.env.VERCEL_API_TOKEN ?? process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_FRONTEND_PROJECT_ID ?? process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID ?? process.env.VERCEL_ORG_ID,
  };
}

export async function ensureFrontendDomain(hostname?: string | null): Promise<DomainProvisionResult> {
  const normalizedHostname = hostname?.trim().toLowerCase();
  if (!normalizedHostname) {
    return { configured: false, reason: "missing_hostname" };
  }

  const { token, projectId, teamId } = getVercelDomainConfig();
  if (!token || !projectId) {
    return { configured: false, reason: "missing_vercel_api_configuration" };
  }

  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/domains`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: normalizedHostname }),
  });

  if (response.ok) {
    return { configured: true, hostname: normalizedHostname, status: "created" };
  }

  const payload = await response.json().catch(() => ({}));
  const message = String(payload?.error?.message ?? payload?.message ?? "");
  if (response.status === 409 || message.toLowerCase().includes("already")) {
    return { configured: true, hostname: normalizedHostname, status: "exists" };
  }

  throw new Error(`VERCEL_DOMAIN_PROVISION_FAILED: ${message || response.statusText}`);
}
