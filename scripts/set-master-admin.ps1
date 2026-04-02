# Quick fix - set the configured master admin via environment

if (-not $env:MASTER_ADMIN_EMAIL) {
    Write-Error "MASTER_ADMIN_EMAIL environment variable is not set"
    exit 1
}

Write-Host "Setting master admin via environment variable..."

# Create or update .env.local with the master admin email
$envContent = "MASTER_ADMIN_EMAIL=$env:MASTER_ADMIN_EMAIL"
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -Force

Write-Host "Environment variable set. The configured master admin should now be redirected to /platform"
Write-Host "Note: You may need to restart the development server for this to take effect."
