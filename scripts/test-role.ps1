# Test script to check if ayany004@gmail.com gets correct role

Write-Host "Testing role resolution for ayany004@gmail.com..."

$env:CONVEX_DEPLOY_KEY = "dev:warmhearted-hummingbird-522|eyJ2MiI6IjNkNGZjYTc5Njg4YTQ5MjA4MzgxNDI4NjVlMDU1YTE3In0="

# List all PLATFORM users to see if ayany004@gmail.com exists
Write-Host "Checking PLATFORM users..."
npx convex run users.listTenantUsers '{"tenantId": "PLATFORM"}' 2>&1 | Select-String "ayany004@gmail.com" -Context 2
