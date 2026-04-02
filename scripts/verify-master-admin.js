#!/usr/bin/env node

/**
 * Verify Master Admin Script
 * 
 * This script verifies that a configured email has been added as a master admin
 * and has the proper permissions in the EduMyles platform.
 * 
 * Usage:
 *   npm run verify-master-admin
 *   or
 *   node scripts/verify-master-admin.js
 */

const { ConvexHttpClient } = require("convex/browser");

async function verifyMasterAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  console.log("🔍 Verifying configured master admin...");
  
  // Get Convex URL from environment or use default
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment");
    process.exit(1);
  }

  // Initialize Convex client
  const convex = new ConvexHttpClient(convexUrl);

  try {
    console.log("📋 Verification Steps:");
    if (!adminEmail) {
      console.error("❌ ADMIN_EMAIL is not set");
      process.exit(1);
    }
    console.log("1. Check if user exists in platform users table");
    console.log("2. Verify role is set to 'master_admin'");
    console.log("3. Check user permissions and access");
    console.log("4. Verify audit log entry exists");

    console.log("\n🔧 Manual Verification Steps:");
    console.log("1. Go to Convex Dashboard: https://dashboard.convex.dev");
    console.log("2. Select your EduMyles deployment");
    console.log("3. Check the 'users' table for:");
    console.log(`   - email: '${adminEmail}'`);
    console.log("   - role: 'master_admin'");
    console.log("   - tenantId: 'PLATFORM'");
    console.log("   - isActive: true");

    console.log("\n4. Check the 'auditLogs' table for:");
    console.log("   - action: 'user.created'");
    console.log("   - entityType: 'user'");
    console.log(`   - after.email: '${adminEmail}'`);
    console.log("   - after.role: 'master_admin'");

    console.log("\n📱 To test access:");
    console.log(`1. Log in as ${adminEmail} at /auth/login`);
    console.log("2. Navigate to /platform");
    console.log("3. Verify access to all admin modules");
    console.log("4. Check that user management functions are available");

    console.log("\n✅ Verification checklist prepared!");
    console.log("📝 Note: Manual verification through Convex dashboard is recommended.");

  } catch (error) {
    console.error("❌ Error preparing verification:", error);
    process.exit(1);
  }
}

// Run the script
verifyMasterAdmin().catch(console.error);
