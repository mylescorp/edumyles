# Simple verification script

Write-Host "Checking admin configuration..."

if (-not $env:CONVEX_DEPLOY_KEY) {
    Write-Error "CONVEX_DEPLOY_KEY environment variable is not set"
    exit 1
}

npx convex run users.hasMasterAdmin '{}'
