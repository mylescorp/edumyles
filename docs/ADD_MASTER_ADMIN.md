# Add Master Admin Guide

## Overview
This guide explains how to add `ayany004@gmail.com` as a master admin to the EduMyles platform.

## Prerequisites
- Access to Convex dashboard (https://dashboard.convex.dev)
- Valid deployment credentials
- Existing master admin session token (for authentication)

## Method 1: Using the Provided Script

1. **Run the script:**
   ```bash
   npm run add-master-admin
   ```

2. **Follow the instructions** - the script will show you the exact mutation to run.

## Method 2: Direct Convex Dashboard Execution

1. **Open Convex Dashboard:**
   - Go to https://dashboard.convex.dev
   - Select your EduMyles deployment

2. **Execute the Mutation:**
   - Navigate to Functions → `platform/users/mutations:createPlatformAdmin`
   - Run the mutation with these arguments:

```json
{
  "sessionToken": "YOUR_EXISTING_ADMIN_SESSION_TOKEN",
  "email": "ayany004@gmail.com", 
  "firstName": "Jonathan",
  "lastName": "Ayany",
  "role": "master_admin"
}
```

## Method 3: Programmatic Execution

If you have a valid session token, you can execute this directly:

```javascript
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient("https://insightful-alpaca-351.convex.cloud");

await convex.mutation("platform/users/mutations:createPlatformAdmin", {
  sessionToken: "YOUR_ADMIN_SESSION_TOKEN",
  email: "ayany004@gmail.com",
  firstName: "Jonathan", 
  lastName: "Ayany",
  role: "master_admin"
});
```

## What This Does

The `createPlatformAdmin` mutation will:
1. Check if `ayany004@gmail.com` already exists
2. Create a new user with `master_admin` role
3. Assign appropriate permissions
4. Log the action for audit purposes
5. Return the user ID and confirmation

## Verification

After adding the master admin:
1. Check the users table in Convex dashboard
2. Look for the email `ayany004@gmail.com` with role `master_admin`
3. Verify the user appears in platform admin listings

## Security Notes

- **Session Token Required**: You need a valid session token from an existing master admin
- **Audit Logging**: This action will be logged in the system audit trail
- **Unique Email**: The system will prevent duplicate email addresses
- **Role Validation**: Only valid admin roles can be assigned

## Troubleshooting

### "CONFLICT: User with email already exists"
- The user already exists in the system
- Use `updatePlatformAdminRole` mutation instead to change their role

### "FORBIDDEN: Invalid session token"
- Your session token has expired or is invalid
- Get a fresh session token from an existing master admin

### "NOT_FOUND: Organization not found"
- The PLATFORM tenant organization doesn't exist
- This should be auto-created by the mutation

## Next Steps

Once ayany004@gmail.com is added as master admin:
1. They can access the platform at `/platform`
2. They have full administrative privileges
3. They can manage other users and system settings
4. They receive all platform notifications and alerts

## Support

If you encounter issues:
1. Check the Convex function logs for detailed error messages
2. Verify your session token is valid and not expired
3. Ensure you have the necessary permissions to create master admins
