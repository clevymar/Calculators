@echo off
setlocal

set "PROJECT_DIR=D:\OneDrive\Python Scripts\Calculators"
set "APP_URL=http://127.0.0.1:5175/"

cd /d "%PROJECT_DIR%"
if errorlevel 1 (
  echo Could not open "%PROJECT_DIR%".
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please install Node.js, then run this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  npm install --strict-ssl=false
  if errorlevel 1 (
    echo Dependency install failed.
    pause
    exit /b 1
  )
)

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process '%APP_URL%'"

echo Starting HP-48S RPN Calculator...
echo.
echo Open: %APP_URL%
echo.
echo Leave this window open while using the calculator.
echo Press Ctrl+C in this window to stop it.
echo.

npm run dev

endlocal
