@echo off
cd /d "%~dp0"

if not exist "nodejs\node.exe" (
  echo Missing nodejs\node.exe
  pause
  exit /b 1
)
if not exist "backend\dist\index.js" (
  echo Missing backend\dist\index.js
  pause
  exit /b 1
)

start "" "%~dp0nodejs\node.exe" "%~dp0backend\dist\index.js"
timeout /t 2 >nul

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://127.0.0.1:8765
  goto :end
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app=http://127.0.0.1:8765
  goto :end
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
  start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:8765
  goto :end
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
  start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:8765
  goto :end
)

start "" http://127.0.0.1:8765

:end
