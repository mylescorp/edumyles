#!/usr/bin/env node

/**
 * Emergency Master Admin Creation
 * 
 * This script creates a master admin without requiring session authentication
 * Use this only if you have direct Convex dashboard access.
 */

const { ConvexHttpClient } = require("convex/browser");

async function createEmergencyAdmin() {
  console.log("🚨 Emergency Master Admin Creation");
  console.log("📝 This requires direct Convex dashboard access");
  
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://insightful-alpaca-351.convex.cloud";
  
  console.log("\n🔧 Direct Database Insert Method:");
  console.log("1. Go to https://dashboard.convex.dev");
  console.log("2. Select your deployment");
  console.log("3. Go to Data → users table");
  console.log("4. Click 'Insert Document'");
  console.log("5. Use this data:");
  
  const timestamp = Date.now();
  const userId = `USR-AYANY004-${timestamp.toString(36)}`;
  
  const userData = {
    tenantId: "PLATFORM",
    eduMylesUserId: userId,
    workosUserId: `pending-${userId}`,
    email: "ayany004@gmail.com",
    firstName: "Jonathan",
    lastName: "Ayany",
    role: "master_admin",
    permissions: [],
    organizationId: "PLATFORM_ORG_ID", // Replace with actual org ID
    isActive: true,
    createdAt: timestamp
  };
  
  console.log(JSON.stringify(userData, null, 2));
  
  console.log("\n📋 Alternative: Find Existing Admin Session");
  console.log("1. Check browser localStorage for existing session token");
  console.log("2. Look for keys: 'sessionToken', 'authToken', 'convexSession'");
  console.log("3. Use that token in the original mutation");
  
  console.log("\n✅ Emergency creation guide ready!");
}

createEmergencyAdmin().catch(console.error);
