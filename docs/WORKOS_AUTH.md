# WorkOS Authentication Implementation

This document describes the WorkOS authentication flow implementation in EduMyles.

## Overview

EduMyles uses WorkOS for enterprise-grade authentication with support for:
- Single Sign-On (SSO) with multiple providers
- Magic link authentication
- Multi-factor authentication (MFA)
- Role-based access control
- Session management
- Audit logging

## Architecture

### Components

1. **WorkOS Configuration** (`frontend/src/lib/workos.ts`)
   - Environment variable management
   - WorkOS client initialization
   - Authentication provider definitions

2. **Authentication Hooks** (`frontend/src/hooks/`)
   - `useWorkOSAuth` - Basic WorkOS authentication
   - `useEduMylesAuth` - Enhanced auth with Convex integration
   - `useUserRole` - Role-based access control
   - `useTenantContext` - Multi-tenant context

3. **Authentication Components** (`frontend/src/components/auth/`)
   - `WorkOSAuthButton` - Provider-specific auth buttons
   - `WorkOSAuthCard` - Complete auth interface
   - `WorkOSMagicLinkForm` - Magic link form

4. **API Routes** (`frontend/src/app/auth/`)
   - `/auth/login/api` - Initiate authentication
   - `/auth/callback` - Handle OAuth callback
   - `/api/auth/me` - Get current user

### Flow

1. **Sign In**: User clicks provider button → Redirect to WorkOS → OAuth callback → Session creation
2. **Sign Up**: Similar to sign in but with waitlist verification
3. **Magic Link**: Email authentication → Link verification → Session creation
4. **Session Management**: Convex stores sessions with role/tenant context

## Environment Variables

```bash
# WorkOS Configuration
WORKOS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_WORKOS_CLIENT_ID=client_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_COOKIE_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKOS_ORGANIZATION_ID=org_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Master Admin Emails
MASTER_ADMIN_EMAILS=admin@edumyles.com,cto@edumyles.com
```

## Usage Examples

### Basic Authentication

```tsx
import { WorkOSAuthButton } from '@/components/auth/WorkOSAuthButton';

function LoginPage() {
  return (
    <WorkOSAuthButton 
      provider="Google" 
      mode="signin"
      redirectTo="/platform"
    />
  );
}
```

### Advanced Authentication Hook

```tsx
import { useEduMylesAuth } from '@/hooks/useEduMylesAuth';

function Dashboard() {
  const { user, isAuthenticated, signOut } = useEduMylesAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      Welcome, {user.firstName}!
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Role-Based Access

```tsx
import { useUserRole } from '@/hooks/useEduMylesAuth';

function AdminPanel() {
  const { hasRequiredRole } = useUserRole('admin');

  if (!hasRequiredRole) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

## Security Features

### 1. Multi-Factor Authentication
- TOTP (Time-based One-Time Password)
- Backup codes
- SMS verification (future)

### 2. Session Security
- Secure HTTP-only cookies
- Session expiration
- Device tracking
- Force logout capability

### 3. Access Control
- Role-based permissions
- Tenant isolation
- Master admin override
- Organization membership

### 4. Audit & Compliance
- Complete audit trail
- Login attempt tracking
- Failed authentication logging
- Session activity monitoring

## Supported Providers

- **Google** - Google Workspace
- **Microsoft** - Azure AD / Microsoft 365
- **GitHub** - GitHub Organizations
- **Slack** - Slack Workspaces
- **Okta** - Okta SSO
- **SAML** - Custom SAML providers

## Multi-Tenant Architecture

EduMyles supports multi-tenancy through:
- Tenant-specific sessions
- Role isolation per tenant
- Organization-based routing
- Cross-tenant admin access

## Error Handling

### Authentication Errors
- Invalid credentials
- Expired sessions
- Unauthorized access
- Configuration errors

### User Experience
- Clear error messages
- Graceful fallbacks
- Loading states
- Redirect handling

## Testing

### Unit Tests
- Hook functionality
- Component rendering
- API route responses

### Integration Tests
- Full authentication flow
- Session management
- Role validation

### End-to-End Tests
- Provider authentication
- Redirect flows
- Error scenarios

## Deployment

### Production Setup
1. Configure WorkOS dashboard
2. Set environment variables
3. Configure redirect URIs
4. Test authentication flow
5. Enable MFA requirements

### Monitoring
- Authentication success rates
- Error tracking
- Session metrics
- Security events

## Future Enhancements

1. **Biometric Authentication** - Fingerprint/face recognition
2. **Risk-Based Authentication** - Adaptive security
3. **Advanced Analytics** - Security dashboards
4. **Compliance Reporting** - Automated reports
5. **Mobile App Support** - Native mobile authentication

## Troubleshooting

### Common Issues

1. **Redirect Loop**
   - Check environment variables
   - Verify redirect URI configuration
   - Clear browser cookies

2. **Session Not Found**
   - Check Convex connection
   - Verify session token format
   - Check server secret

3. **Role Not Assigned**
   - Verify user provisioning
   - Check master admin emails
   - Review waitlist status

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
```

Check browser console and Convex logs for detailed error information.

## Support

For WorkOS-specific issues:
- WorkOS Dashboard: https://dashboard.workos.com
- WorkOS Documentation: https://workos.com/docs

For EduMyles-specific issues:
- Check this documentation
- Review error logs
- Contact development team
