# PowerShell script to verify Convex admin setup

Write-Host "Checking admin setup..."

if (-not $env:CONVEX_DEPLOY_KEY) {
    Write-Error "CONVEX_DEPLOY_KEY environment variable is not set"
    exit 1
}

npx convex run users.hasMasterAdmin '{}'

Write-Host "Check completed!"
