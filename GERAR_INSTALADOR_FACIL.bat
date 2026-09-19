@echo off
setlocal enabledelayedexpansion
title OSNIR TURISMO - Gerador de Instalador Windows (.exe)
color 0B
cls

echo ===============================================================================
echo                OSNIR TURISMO - GERADOR DE INSTALADOR (.EXE)
echo ===============================================================================
echo.

:: 1. Verificacao do Node.js
echo [Passo 1/4] Verificando se o Node.js esta presente...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERRO FATAL] O Node.js nao esta instalado neste computador!
    echo.
    echo Para instalar em 2 minutos:
    echo  1. Acesse: https://nodejs.org/
    echo  2. Baixe e instale a versao recomendada "LTS".
    echo  3. Apos a instalacao, feche e abra este arquivo novamente.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js detectado: !NODE_VERSION!

:: 2. Instalacao das dependencias
echo.
echo [Passo 2/4] Instalando dependencias do projeto...
call npm install --no-audit --prefer-offline
if %errorlevel% neq 0 (
    echo [AVISO] Tentando instalacao flexivel...
    call npm install --force
)

:: 3. Compilacao do aplicativo (Vite)
echo.
echo [Passo 3/4] Compilando a interface do sistema (Vite Build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar a interface do sistema.
    echo.
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo [ERRO] A pasta dist\index.html nao foi gerada. Verifique as mensagens de erro acima.
    pause
    exit /b 1
)
echo [OK] Arquivos compilados com sucesso na pasta dist!

:: 4. Instalacao do Electron e Electron Builder
echo.
echo [Passo 4/4] Verificando modulo empacotador Electron...
call npm install electron@33.2.1 electron-builder@25.1.8 --save-dev --no-audit

echo.
echo ===============================================================================
echo            CRIANDO O INSTALADOR EXECUTAVEL (.EXE) PARA WINDOWS...
echo            (Aguarde cerca de 30 a 60 segundos...)
echo ===============================================================================
echo.

call npx electron-builder --win nsis -c.extraMetadata.main=electron-main.js

if exist "dist-electron\*.exe" (
    echo.
    echo ===============================================================================
    echo               PARABENS! INSTALADOR WINDOWS GERADO COM SUCESSO!
    echo ===============================================================================
    echo.
    echo O seu instalador .exe pronto para vender e instalar nos clientes esta em:
    echo.
    dir /b /s dist-electron\*.exe
    echo.
    echo Abrindo a pasta dist-electron no seu Windows Explorer...
    start "" explorer dist-electron
) else (
    echo.
    echo ===============================================================================
    echo [FALHA NA GERACAO] O arquivo .exe nao foi encontrado na pasta dist-electron.
    echo.
    echo Por favor, tire uma foto ou copie as linhas de erro acima para verificarmos.
    echo ===============================================================================
)

echo.
pause
