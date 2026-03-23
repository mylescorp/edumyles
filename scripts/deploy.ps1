# Deploy script for Convex

Write-Host "Deploying Convex functions..."

$env:CONVEX_DEPLOY_KEY = "dev:warmhearted-hummingbird-522|eyJ2MiI6IjNkNGZjYTc5Njg4YTQ5MjA4MzgxNDI4NjVlMDU1YTE3In0="

npx convex deploy

Write-Host "Deployment completed!"
