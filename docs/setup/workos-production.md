# WorkOS Production Setup

## Overview

This guide covers the production setup for WorkOS authentication in the EduMyles platform.

## Prerequisites

- WorkOS account with organization access
- Production environment configured
- SSL certificates for domains

## Production Configuration

### Environment Variables

```bash
# WorkOS Production
WORKOS_API_KEY=prod_xxxxxxxxxxxxxxxx
WORKOS_CLIENT_ID=client_xxxxxxxxxxxxxxxx
WORKOS_SECRET_KEY=secret_xxxxxxxxxxxxxxxx

# Redirect URLs
WORKOS_REDIRECT_URI=https://edumyles.com/auth/callback
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://edumyles.com/auth/callback

# Domain Configuration
NEXT_PUBLIC_APP_URL=https://edumyles.com
```

### Domain Setup

1. **Configure Custom Domains** in WorkOS dashboard
2. **Set up SSL certificates** for all subdomains
3. **Update redirect URIs** for production environment
4. **Configure webhook endpoints** for real-time sync

### Security Settings

- Enable **MFA** for all admin users
- Configure **session timeouts** appropriately
- Set up **audit logging** for compliance
- Enable **IP allowlisting** if required

## Testing Production Setup

```bash
# Test authentication flow
npm run test:auth:production

# Verify webhook endpoints
npm run test:webhooks:production
```

## Monitoring

- Monitor WorkOS dashboard for authentication metrics
- Set up alerts for failed authentication attempts
- Track webhook delivery success rates
- Monitor session creation and expiration

## Troubleshooting

Common issues and solutions for production WorkOS setup.
