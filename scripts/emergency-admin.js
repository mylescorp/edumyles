#!/usr/bin/env node

/**
 * Emergency Master Admin Recovery Guide
 * 
 * This script explains the supported recovery path using a platform admin session.
 */

async function createEmergencyAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  console.log("🚨 Emergency Master Admin Recovery");
  console.log("📝 This flow requires a valid platform admin session token");

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL environment variable is required");
  }

  console.log("\n🔧 Supported Recovery Method:");
  console.log("1. Go to https://dashboard.convex.dev");
  console.log("2. Select your deployment");
  console.log("3. Go to Functions → users:promoteUserEmailToMasterAdmin");
  console.log("4. Run with this payload:");
  console.log(JSON.stringify({
    email: adminEmail,
    sessionToken: "YOUR_ADMIN_SESSION_TOKEN",
  }, null, 2));

  console.log("\n📋 Session Token Recovery Tip:");
  console.log("1. Sign in as an existing platform admin");
  console.log("2. Inspect the edumyles_session cookie");
  console.log("3. Use that token in the mutation above");

  console.log("\n✅ Emergency recovery guide ready!");
}

createEmergencyAdmin().catch(console.error);
