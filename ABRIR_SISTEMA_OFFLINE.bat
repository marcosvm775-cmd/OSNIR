@echo off
pushd "%~dp0"
title OSNIR TURISMO - Sistema de Gestao Offline
cls

echo ===============================================================================
echo            OSNIR TURISMO - SISTEMA DE GESTAO DE VIAGENS
echo ===============================================================================
echo.
echo Iniciando aplicativo em modo desktop offline...
echo.

:: 1. Tenta abrir no Microsoft Edge em modo Aplicativo Nativo (Janela limpa sem barra de navegacao)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%~dp0dist/index.html" --window-size=1280,800
    exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="file:///%~dp0dist/index.html" --window-size=1280,800
    exit /b 0
)

:: 2. Tenta abrir no Google Chrome em modo Aplicativo Nativo
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="file:///%~dp0dist/index.html" --window-size=1280,800
    exit /b 0
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="file:///%~dp0dist/index.html" --window-size=1280,800
    exit /b 0
)

if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="file:///%~dp0dist/index.html" --window-size=1280,800
    exit /b 0
)

:: 3. Fallback: Abre no navegador padrao
start "" "%~dp0dist\index.html"
exit /b 0
