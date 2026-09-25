@echo off
setlocal enabledelayedexpansion
pushd "%~dp0"
title OSNIR TURISMO - Sistema de Gestao Offline
cls

echo ===============================================================================
echo            OSNIR TURISMO - SISTEMA DE GESTAO DE VIAGENS
echo ===============================================================================
echo.
echo Verificando arquivos do sistema...

:: Se o index.html compilado nao existir na pasta dist, avisa ou compila
if not exist "%~dp0dist\index.html" (
    if exist "%~dp0index.html" (
        echo [INFO] Compilando arquivos pela primeira vez... Aguarde alguns instantes...
        if not exist "%~dp0node_modules" (
            call npm install --no-audit --no-fund >nul 2>&1
        )
        call npx --yes vite build
    )
)

if not exist "%~dp0dist\index.html" (
    color 0C
    echo [ERRO] O arquivo dist\index.html nao foi encontrado.
    echo Por favor, certifique-se de manter a pasta "dist" junto deste iniciador.
    pause
    exit /b 1
)

echo [OK] Sistema verificado com sucesso!
echo Iniciando servidor local offline protegido contra tela branca...

:: Inicia o servidor local offline em segundo plano
start "" /b powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
timeout /t 1 /nobreak >nul

set "APP_URL=http://127.0.0.1:38450"
set "FALLBACK_URL=file:///%~dp0dist/index.html"
set "CHROME_FLAGS=--allow-file-access-from-files --allow-running-insecure-content --disable-web-security --user-data-dir=\"%temp%\OsnirTurismoBrowserProfile\" --window-size=1280,820"

:: 1. Tenta abrir no Microsoft Edge em modo Janela de Aplicativo
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%"
    exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%"
    exit /b 0
)

:: 2. Tenta abrir no Google Chrome em modo Janela de Aplicativo
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
    exit /b 0
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
    exit /b 0
)

if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
    exit /b 0
)

:: 3. Abre no navegador padrao
start "" "%APP_URL%"
exit /b 0
