@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   DARK ZONE 黑域：诡城 - 本地启动器
echo   正在启动游戏，请稍候...
echo ==========================================
set PORT=8123
:retry
netstat -an | findstr ":%PORT% " >nul 2>&1
if %errorlevel%==0 (
  set /a PORT+=1
  goto retry
)
start "DARK ZONE server" /min cmd /c "python -m http.server %PORT%"
timeout /t 2 /nobreak >nul
start http://localhost:%PORT%/index.html
timeout /t 20 /nobreak >nul
exit
