@echo off
chcp 936 >nul 2>&1
setlocal enabledelayedexpansion

:: ========================================
::  文的项目工作台 - 一键停止脚本
::  双击运行即可停止后台服务
:: ========================================

set "PORT=3456"

echo.
echo ========================================
echo   文的项目工作台 - 一键停止
echo ========================================
echo.

:: 通过端口查找并终止进程
set "FOUND=0"
set "KILLED="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING" 2^>nul') do (
    echo [信息] 找到监听端口 %PORT% 的进程，PID: %%a
    :: 跳过已终止的 PID
    echo !KILLED! | findstr "%%a" >nul 2>&1
    if !errorlevel! neq 0 (
        taskkill /PID %%a /F >nul 2>&1
        if !errorlevel! equ 0 (
            echo [成功] 已终止进程 PID %%a
            set "FOUND=1"
            set "KILLED=!KILLED! %%a"
        ) else (
            echo [警告] 终止进程 %%a 失败，可能需要管理员权限
        )
    )
)

:: 通过窗口标题查找（兜底）
taskkill /FI "WINDOWTITLE eq WenWorkbench-Server*" /F >nul 2>&1
if !errorlevel! equ 0 (
    set "FOUND=1"
)

if "!FOUND!"=="0" (
    echo [信息] 未发现运行中的服务（端口 %PORT% 无监听进程）
    echo        服务可能已经停止。
) else (
    echo.
    echo ========================================
    echo   服务已成功停止
    echo ========================================
)

echo.
echo 按任意键关闭此窗口...
pause >nul
