// ============================================================
// EduMyles — WorkOS Configuration
// ============================================================

import { WorkOS } from '@workos-inc/node';

export interface WorkOSConfig {
  apiKey: string;
  clientId: string;
  redirectUri: string;
  cookiePassword: string;
  organizationId?: string;
}

/**
 * Initialize WorkOS client with environment variables
 */
export function createWorkOSClient(): WorkOS {
  const config = getWorkOSConfig();
  
  return new WorkOS(config.apiKey, {
    clientId: config.clientId,
  });
}

/**
 * Get WorkOS configuration from environment variables
 */
export function getWorkOSConfig(): WorkOSConfig {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const redirectUri = process.env.WORKOS_REDIRECT_URI || process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;
  const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
  const organizationId = process.env.WORKOS_ORGANIZATION_ID;

  if (!apiKey) {
    throw new Error('WORKOS_API_KEY environment variable is required');
  }

  if (!clientId) {
    throw new Error('NEXT_PUBLIC_WORKOS_CLIENT_ID environment variable is required');
  }

  if (!redirectUri) {
    throw new Error('WORKOS_REDIRECT_URI environment variable is required');
  }

  if (!cookiePassword) {
    throw new Error('WORKOS_COOKIE_PASSWORD environment variable is required');
  }

  if (cookiePassword.length < 32) {
    throw new Error('WORKOS_COOKIE_PASSWORD must be at least 32 characters long');
  }

  return {
    apiKey,
    clientId,
    redirectUri,
    cookiePassword,
    organizationId,
  };
}

/**
 * WorkOS client singleton
 */
let workosClient: WorkOS | null = null;

export function getWorkOS(): WorkOS {
  if (!workosClient) {
    workosClient = createWorkOSClient();
  }
  return workosClient;
}

/**
 * WorkOS authentication URLs
 */
export const WORKOS_AUTH_URLS = {
  login: '/auth/login',
  callback: '/auth/callback',
  logout: '/auth/logout',
  signup: '/auth/signup',
} as const;

/**
 * Authentication providers supported by WorkOS
 */
export const AUTH_PROVIDERS = {
  Google: 'Google',
  Microsoft: 'Microsoft',
  GitHub: 'GitHub',
  Slack: 'Slack',
  Okta: 'Okta',
  SAML: 'SAML',
  MagicLink: 'MagicLink',
} as const;

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];
