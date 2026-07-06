@echo off
chcp 936 >nul 2>&1
setlocal enabledelayedexpansion

:: ========================================
::  文的项目工作台 - 一键启动脚本
::  双击运行即可启动服务并打开浏览器
:: ========================================

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "PORT=3456"

echo.
echo ========================================
echo   文的项目工作台 - 一键启动
echo ========================================
echo.

:: 1. 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo [1/5] Node.js 版本: %NODE_VER%

:: 2. 检查端口是否已被占用（服务可能已在运行）
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [提示] 端口 %PORT% 已有服务在监听，可能已启动过。
    echo        如需重启，请先运行 stop.bat 停止服务。
    echo.
    echo 正在打开浏览器...
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:%PORT%"
    exit /b 0
)

:: 3. 检查并安装依赖
echo [2/5] 检查依赖...
if not exist "%BACKEND%\node_modules" (
    echo       首次运行，正在安装依赖包...
    cd /d "%BACKEND%"
    call npm install
    if !errorlevel! neq 0 (
        echo [错误] 依赖安装失败，请检查网络后重试
        echo.
        pause
        exit /b 1
    )
    echo       依赖安装完成
) else (
    echo       依赖已就绪
)

:: 4. 启动服务器（最小化窗口后台运行）
echo [3/5] 正在启动服务器...
cd /d "%BACKEND%"
start "WenWorkbench-Server" /min cmd /c "node server.js > server.log 2>&1"

:: 5. 等待服务器就绪（最多等待 15 秒）
echo [4/5] 等待服务器就绪...
set "READY=0"
for /l %%i in (1,1,15) do (
    timeout /t 1 /nobreak >nul
    netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
    if !errorlevel! equ 0 (
        set "READY=1"
        goto :ready
    )
    echo       等待中... %%i/15
)

:ready
if "!READY!"=="0" (
    echo.
    echo [错误] 服务器启动超时
    echo        请查看日志文件: backend\server.log
    echo.
    type "%BACKEND%\server.log" 2>nul
    echo.
    pause
    exit /b 1
)

echo [5/5] 服务器已就绪!
echo.
echo ========================================
echo   服务启动成功!
echo ----------------------------------------
echo   前端地址:  http://localhost:%PORT%
echo   API 地址:  http://localhost:%PORT%/api
echo   日志文件:  backend\server.log
echo   停止服务:  双击 stop.bat
echo ========================================
echo.

:: 6. 打开浏览器
echo 正在打开浏览器...
start "" "http://localhost:%PORT%"

echo.
echo 提示: 此窗口可以关闭，服务将在后台继续运行。
echo 按任意键关闭此窗口...
pause >nul
