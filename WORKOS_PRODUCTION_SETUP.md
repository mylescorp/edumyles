# WorkOS Production Setup Checklist

## 🚨 CRITICAL: Production Deployment Setup

This document provides the complete checklist for configuring WorkOS authentication for the EduMyles production deployment at **edumyles.vercel.app**.

---

## 📋 Environment Variables Configuration

### Required Environment Variables for Vercel (Landing app — edumyles.vercel.app)

The **landing** app is the auth entrypoint. Set these on the Vercel project that serves **edumyles.vercel.app** (root `vercel.json` builds `landing`):

```bash
# WorkOS (required for login/signup/callback)
WORKOS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_WORKOS_CLIENT_ID=client_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKOS_REDIRECT_URI=https://edumyles.vercel.app/auth/callback
# Optional: NEXT_PUBLIC_WORKOS_REDIRECT_URI same as above if needed by client

# Convex (required for session creation in callback)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Optional: where to send users after login (if app is on another domain)
# NEXT_PUBLIC_APP_URL=https://app.edumyles.vercel.app
MASTER_ADMIN_EMAIL=admin@edumyles.com
```

### If you also deploy the frontend app (e.g. app.edumyles.vercel.app)

On the **frontend** Vercel project, set:

```bash
# Redirect unauthenticated users to landing auth
NEXT_PUBLIC_AUTH_BASE_URL=https://edumyles.vercel.app
# Plus your existing Convex and app env vars
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Auth routing summary

| Action              | Route / behavior |
|---------------------|------------------|
| Get Started button  | `/auth/signup` (landing) |
| Sign in / Log in    | `/auth/login` (landing) |
| Sign up             | `/auth/signup` (landing) |
| WorkOS callback     | `/auth/callback` (landing) — creates Convex session, sets cookies, redirects by role |
| Logout              | `/auth/logout` (landing) — clears cookies, redirects to `/` |

All auth uses the **WorkOS SDK** (`@workos-inc/node`): `getAuthorizationUrl` and `authenticateWithCode`. Redirect URI in WorkOS Dashboard must be exactly `https://edumyles.vercel.app/auth/callback`.

---

## 🔧 WorkOS Dashboard Configuration

### 1. Application Settings

**Login to WorkOS Dashboard**: https://dashboard.workos.com

#### Application Details
- **Application Name**: EduMyles Production
- **Application Type**: Single Page App (SPA)
- **Description**: School management platform for African schools

#### Redirect URIs (PRODUCTION)
```
https://edumyles.vercel.app/auth/callback
```

#### Allowed Origins
```
https://edumyles.vercel.app
```

#### Post-Login Redirect URLs
```
https://edumyles.vercel.app/platform
https://edumyles.vercel.app/admin
https://edumyles.vercel.app/portal/teacher
https://edumyles.vercel.app/portal/student
https://edumyles.vercel.app/portal/parent
https://edumyles.vercel.app/portal/alumni
https://edumyles.vercel.app/portal/partner
```

### 2. Organization Setup

#### Platform Organization
- **Organization ID**: `org_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Organization Name**: EduMyles Platform
- **Domain**: `edumyles.com`

#### School Organizations
Each school should have its own organization with:
- Organization ID: `org_[school-identifier]`
- Domain: `[school-domain].ac.ke` or similar
- Associated tenant ID in Convex

### 3. Connection Configuration

#### Enabled Connections
- **Google OAuth**: Enabled for SSO
- **Microsoft OAuth**: Enabled for SSO
- **Email Magic Link**: Enabled for passwordless login
- **SSO**: Enabled for enterprise SSO

#### Connection Settings
- **Connection Type**: OAuth 2.0
- **Scope**: `email profile`
- **PKCE**: Enabled (recommended for security)

---

## 🛡️ Security Configuration

### 1. Cookie Settings
- **Secure**: true (HTTPS only)
- **HttpOnly**: true (session cookie)
- **SameSite**: lax
- **Max Age**: 30 days

### 2. Session Management
- **Session Token**: 32-byte random string
- **Session Duration**: 30 days
- **Token Refresh**: Automatic on expiration

### 3. CORS Configuration
- **Allowed Origins**: `https://edumyles.vercel.app`
- **Allowed Methods**: GET, POST, PUT, DELETE
- **Allowed Headers**: Authorization, Content-Type

---

## 🔄 Authentication Flow

### 1. Login Flow
```
1. User clicks "Get Started" → /auth/login
2. User selects login method (Google/Microsoft/Email)
3. Redirect to WorkOS authorize endpoint
4. WorkOS authenticates user
5. Redirect to /auth/callback with code
6. Exchange code for user profile
7. Create session in Convex
8. Redirect to role-based dashboard
```

### 2. Signup Flow
```
1. User enters email and school name → /auth/signup
2. Redirect to WorkOS with signup hint
3. WorkOS authenticates user
4. Redirect to /auth/callback with code
5. Exchange code for user profile
6. Create tenant and user in Convex
7. Create session
8. Redirect to admin dashboard
```

### 3. Role-Based Redirects
- **master_admin/super_admin**: /platform
- **school_admin/principal**: /admin
- **teacher**: /portal/teacher
- **student**: /portal/student
- **parent**: /portal/parent
- **alumni**: /portal/alumni
- **partner**: /portal/partner

---

## 🧪 Testing Checklist

### 1. Pre-Deployment Testing
- [ ] All environment variables set in Vercel
- [ ] WorkOS application configured with production URLs
- [ ] Redirect URIs match exactly
- [ ] CORS settings configured
- [ ] SSL certificate valid

### 2. Authentication Testing
- [ ] Google OAuth login works
- [ ] Microsoft OAuth login works
- [ ] Email magic link works
- [ ] Session creation works
- [ ] Role-based redirects work
- [ ] Logout functionality works

### 3. Error Handling Testing
- [ ] Invalid OAuth state handled
- [ ] Network errors handled gracefully
- [ ] User cancellation handled
- [ ] Permission denied handled

### 4. Security Testing
- [ ] Session cookies are secure
- [ ] CSRF protection works
- [ ] Rate limiting works
- [ ] Tenant isolation enforced

---

## 🚨 Common Issues & Solutions

### Issue 1: "Authentication service not configured"
**Cause**: Missing WORKOS_API_KEY or NEXT_PUBLIC_WORKOS_CLIENT_ID
**Solution**: Add environment variables in Vercel dashboard

### Issue 2: "Redirect URI mismatch"
**Cause**: WorkOS redirect URI doesn't match deployment URL
**Solution**: Update WorkOS dashboard with `https://edumyles.vercel.app/auth/callback`

### Issue 3: "CORS error"
**Cause**: Origin not allowed in WorkOS settings
**Solution**: Add `https://edumyles.vercel.app` to allowed origins

### Issue 4: "Session not created"
**Cause**: Convex connection issue or database error
**Solution**: Check Convex deployment and connection strings

### Issue 5: "Role not found"
**Cause**: User exists but role not assigned
**Solution**: Ensure user role is set in Convex users table

---

## 📊 Monitoring & Logging

### 1. Authentication Events to Monitor
- Login attempts (success/failure)
- Signup attempts (success/failure)
- Session creation/deletion
- Role-based access attempts
- Error rates by type

### 2. Key Metrics
- Authentication success rate
- Average login time
- Session duration
- Error frequency
- User adoption rate

### 3. Alerting
- High authentication failure rate
- WorkOS API errors
- Convex connection issues
- Unusual login patterns

---

## 🔄 Deployment Steps

### 1. Pre-Deployment
1. Set all environment variables in Vercel
2. Configure WorkOS dashboard
3. Test authentication flow locally
4. Verify SSL certificate

### 2. Deployment
1. Deploy landing page to Vercel
2. Deploy frontend to Vercel
3. Deploy Convex backend
4. Update DNS if needed

### 3. Post-Deployment
1. Test authentication flow in production
2. Verify all redirects work
3. Test error handling
4. Monitor for issues

### 4. Go-Live
1. Enable production features
2. Monitor authentication metrics
3. Set up alerting
4. Document any issues

---

## 📞 Support

### WorkOS Support
- **Documentation**: https://workos.com/docs
- **Status Page**: https://status.workos.com
- **Support Email**: support@workos.com

### EduMyles Support
- **Technical Lead**: [Contact Information]
- **Emergency Contact**: [Contact Information]

---

## ✅ Final Verification Checklist

Before going live with WorkOS authentication:

- [ ] All environment variables set in Vercel
- [ ] WorkOS application configured with production URLs
- [ ] Redirect URIs match exactly: `https://edumyles.vercel.app/auth/callback`
- [ ] All authentication providers tested (Google, Microsoft, Email)
- [ ] Role-based redirects working for all user types
- [ ] Session management working correctly
- [ ] Error handling tested and working
- [ ] Security measures in place (secure cookies, CORS)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] Team trained on authentication flow

---

**🚀 Ready for Production Deployment**

Once all items in this checklist are complete, the WorkOS authentication system will be fully functional for the EduMyles production deployment at edumyles.vercel.app.
