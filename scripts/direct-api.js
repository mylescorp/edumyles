#!/usr/bin/env node

/**
 * Direct API Call to Add Master Admin
 * 
 * This script shows the direct API payload for promoting a master admin.
 */

const https = require('https');

async function callConvexAPI() {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const functionName = "users:promoteUserEmailToMasterAdmin";
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminSessionToken = process.env.ADMIN_SESSION_TOKEN;

  if (!deploymentUrl || !adminEmail || !adminSessionToken) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL, ADMIN_EMAIL, and ADMIN_SESSION_TOKEN are required");
  }
  
  const data = {
    args: {
      email: adminEmail,
      sessionToken: adminSessionToken,
    }
  };

  const options = {
    hostname: deploymentUrl.replace(/^https?:\/\//, ""),
    port: 443,
    path: `/api/mutation/${functionName}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(data).length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log("🚀 Attempting direct API call to promote master admin...");
  
  try {
    const result = await callConvexAPI();
    console.log("✅ Success!", result);
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("\n🔧 Alternative approach needed...");
    console.log("Please use the Convex Dashboard method:");
    console.log("1. Go to https://dashboard.convex.dev");
    console.log("2. Select your deployment");
    console.log("3. Go to Functions → users:promoteUserEmailToMasterAdmin");
    console.log("4. Run with the configured ADMIN_EMAIL and ADMIN_SESSION_TOKEN");
  }
}

main().catch(console.error);
