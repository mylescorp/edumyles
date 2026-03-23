# PowerShell script to add master admin
# Run this script in PowerShell

Write-Host "🚀 Adding ayany004@gmail.com as Master Admin..."

# Set the environment variable
$env:CONVEX_DEPLOY_KEY = "dev:warmhearted-hummingbird-522|eyJ2MiI6IjNkNGZjYTc5Njg4YTQ5MjA4MzgxNDI4NjVlMDU1YTE3In0="

# Run the Convex command with proper JSON escaping
$jsonArgs = '{\"email\": \"ayany004@gmail.com\", \"firstName\": \"Jonathan\", \"lastName\": \"Ayany\"}'
npx convex run emergencyAdmin:createEmergencyMasterAdmin $jsonArgs

Write-Host "✅ Done!"
