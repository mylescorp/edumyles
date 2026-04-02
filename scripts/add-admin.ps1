# PowerShell script to add master admin
# Run this script in PowerShell

Write-Host "Adding master admin..."

if (-not $env:CONVEX_DEPLOY_KEY) {
    Write-Error "CONVEX_DEPLOY_KEY environment variable is not set"
    exit 1
}

if (-not $env:ADMIN_SESSION_TOKEN) {
    Write-Error "ADMIN_SESSION_TOKEN environment variable is not set"
    exit 1
}

$jsonArgs = "{`"email`": `"$env:ADMIN_EMAIL`", `"sessionToken`": `"$env:ADMIN_SESSION_TOKEN`"}"
npx convex run users.promoteUserEmailToMasterAdmin $jsonArgs

Write-Host "Done!"
