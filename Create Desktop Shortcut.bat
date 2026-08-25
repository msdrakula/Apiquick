@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dir = (Get-Location).Path; $desk = [Environment]::GetFolderPath('Desktop'); $s = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desk 'Apiquick.lnk')); $s.TargetPath = (Join-Path $dir 'Apiquick Desktop.bat'); $s.WorkingDirectory = $dir; $ico = Join-Path $dir 'apiquick.ico'; if (Test-Path $ico) { $s.IconLocation = $ico + ',0' } else { $s.IconLocation = (Join-Path $dir 'nodejs\node.exe') + ',0' }; $s.Description = 'Apiquick'; $s.Save(); Write-Host 'Shortcut created:' (Join-Path $desk 'Apiquick.lnk')"
echo.
pause
