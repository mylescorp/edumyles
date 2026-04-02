# Deploy script for Convex

Write-Host "Deploying Convex functions..."

if (-not $env:CONVEX_DEPLOY_KEY) {
    Write-Error "CONVEX_DEPLOY_KEY environment variable is not set"
    exit 1
}

npx convex deploy

Write-Host "Deployment completed!"
