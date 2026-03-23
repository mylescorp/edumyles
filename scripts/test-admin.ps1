# PowerShell script to test if master admin was created

Write-Host "Testing if ayany004@gmail.com was created as Master Admin..."

# Set the environment variable
$env:CONVEX_DEPLOY_KEY = "dev:warmhearted-hummingbird-522|eyJ2MiI6IjNkNGZjYTc5Njg4YTQ5MjA4MzgxNDI4NjVlMDU1YTE3In0="

# Run the test query
npx convex run testAdmin:testMasterAdmin '{}'

Write-Host "Test completed!"
