@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found.
    exit /b 1
)

cd /d "%BACKEND%"
node --test
exit /b %errorlevel%
