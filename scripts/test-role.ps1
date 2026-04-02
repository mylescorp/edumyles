# Test script to check platform users

Write-Host "Checking PLATFORM users..."

if (-not $env:CONVEX_DEPLOY_KEY) {
    Write-Error "CONVEX_DEPLOY_KEY environment variable is not set"
    exit 1
}

npx convex run users.listTenantUsers '{"tenantId": "PLATFORM"}'
