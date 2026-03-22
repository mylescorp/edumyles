# Simple verification script

Write-Host "Checking if ayany004@gmail.com was added as master admin..."

$env:CONVEX_DEPLOY_KEY = "dev:warmhearted-hummingbird-522|eyJ2MiI6IjNkNGZjYTc5Njg4YTQ5MjA4MzgxNDI4NjVlMDU1YTE3In0="

# Try to run just the emergency admin function again to see the result
Write-Host "Running emergency admin creation (will show if user exists)..."
npx convex run emergencyAdmin:createEmergencyMasterAdmin '{\"email\": \"ayany004@gmail.com\", \"firstName\": \"Jonathan\", \"lastName\": \"Ayany\"}' 2>&1 | Select-Object -Last 5
