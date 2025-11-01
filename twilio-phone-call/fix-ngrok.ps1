# Run this script as Administrator to allow ngrok

# Add Windows Defender exclusion for ngrok
Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\ngrok"
Add-MpPreference -ExclusionProcess "ngrok.exe"

Write-Host "✅ Windows Defender exclusions added for ngrok!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: ngrok http 3000" -ForegroundColor Yellow
