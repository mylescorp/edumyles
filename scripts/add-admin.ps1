# PowerShell script to add master admin
# Run this script in PowerShell

Write-Host "Adding master admin..."

if (-not $env:CONVEX_DEPLOY_KEY) {
    Write-Error "CONVEX_DEPLOY_KEY environment variable is not set"
    exit 1
}

if (-not $env:EMERGENCY_ADMIN_TOKEN) {
    Write-Error "EMERGENCY_ADMIN_TOKEN environment variable is not set"
    exit 1
}

$jsonArgs = "{`"email`": `"$env:ADMIN_EMAIL`", `"firstName`": `"$env:ADMIN_FIRST_NAME`", `"lastName`": `"$env:ADMIN_LAST_NAME`", `"emergencyToken`": `"$env:EMERGENCY_ADMIN_TOKEN`"}"
npx convex run emergencyAdmin:createEmergencyMasterAdmin $jsonArgs

Write-Host "Done!"
