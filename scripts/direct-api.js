#!/usr/bin/env node

/**
 * Direct API Call to Add Master Admin
 * 
 * This script attempts to call the Convex API directly using the deployment URL
 */

const https = require('https');

async function callConvexAPI() {
  const deploymentUrl = "https://warmhearted-hummingbird-522.convex.cloud";
  const functionName = "emergencyAdmin:createEmergencyMasterAdmin";
  
  const data = {
    args: {
      email: "ayany004@gmail.com",
      firstName: "Jonathan",
      lastName: "Ayany"
    }
  };

  const options = {
    hostname: "warmhearted-hummingbird-522.convex.cloud",
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
  console.log("🚀 Attempting direct API call to add master admin...");
  
  try {
    const result = await callConvexAPI();
    console.log("✅ Success!", result);
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("\n🔧 Alternative approach needed...");
    console.log("Please use the Convex Dashboard method:");
    console.log("1. Go to https://dashboard.convex.dev");
    console.log("2. Select deployment: warmhearted-hummingbird-522");
    console.log("3. Go to Functions → emergencyAdmin:createEmergencyMasterAdmin");
    console.log("4. Run with: {\"email\": \"ayany004@gmail.com\", \"firstName\": \"Jonathan\", \"lastName\": \"Ayany\"}");
  }
}

main().catch(console.error);
