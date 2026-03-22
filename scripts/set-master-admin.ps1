# Quick fix - set ayany004@gmail.com as master admin via environment

Write-Host "Setting ayany004@gmail.com as master admin via environment variable..."

# Create or update .env.local with the master admin email
$envContent = "MASTER_ADMIN_EMAIL=ayany004@gmail.com"
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -Force

Write-Host "Environment variable set. Now ayany004@gmail.com should be redirected to /platform"
Write-Host "Note: You may need to restart the development server for this to take effect."
