#!/usr/bin/env node

/**
 * Add Master Admin Script
 * 
 * This script shows how to promote a configured email to master admin.
 * Run this script with proper Convex environment configuration.
 * 
 * Usage:
 *   npm run add-master-admin
 *   or
 *   CONVEX_DEPLOY_KEY=your_key node scripts/add-master-admin.js
 */

const { ConvexHttpClient } = require("convex/browser");

async function addMasterAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  console.log("🔐 Preparing master admin promotion...");
  
  // Get Convex URL from environment or use default
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment");
    process.exit(1);
  }

  // Initialize Convex client
  const convex = new ConvexHttpClient(convexUrl);

  try {
    // First, we need to authenticate as an existing platform admin
    // This requires a valid session token from an existing master admin
    
    // For now, let's show what the mutation call would look like
    if (!adminEmail) {
      console.error("❌ ADMIN_EMAIL is not set");
      process.exit(1);
    }

    console.log(`📋 To add ${adminEmail} as master admin, run this mutation:`);
    console.log({
      mutation: "users.promoteUserEmailToMasterAdmin",
      args: {
        sessionToken: "YOUR_ADMIN_SESSION_TOKEN", // Replace with valid session token
        email: adminEmail
      }
    });

    console.log("\n🔧 Alternative: Use Convex Dashboard");
    console.log("1. Go to https://dashboard.convex.dev");
    console.log("2. Select your deployment");
    console.log("3. Go to Functions > users:promoteUserEmailToMasterAdmin");
    console.log("4. Run the mutation with these arguments:");
    console.log(JSON.stringify({
      sessionToken: "YOUR_ADMIN_SESSION_TOKEN",
      email: adminEmail
    }, null, 2));

    console.log("\n✅ Master admin addition prepared!");
    console.log("📝 Note: You need a valid session token from an existing master admin to execute this.");

  } catch (error) {
    console.error("❌ Error preparing master admin addition:", error);
    process.exit(1);
  }
}

// Run the script
addMasterAdmin().catch(console.error);
