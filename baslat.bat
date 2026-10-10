@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Lutfen https://nodejs.org adresinden Node.js LTS kurun.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Gerekli paketler yukleniyor, bu islem bir kez yapilir...
  call npm install
)
call npm start
