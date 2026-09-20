@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title OSNIR TURISMO - Gerador de Instalador Windows (.exe)
color 0B
cls

echo ===============================================================================
echo                OSNIR TURISMO - GERADOR DE INSTALADOR (.EXE)
echo ===============================================================================
echo.
echo Pasta do projeto: %~dp0
echo.

:: 1. Verificacao do Node.js
echo [Passo 1/4] Verificando se o Node.js esta instalado no Windows...

where node >nul 2>&1
if %errorlevel% equ 0 goto :node_ok

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%" & goto :node_ok
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%" & goto :node_ok
if exist "%LocalAppData%\Programs\nodejs\node.exe" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%" & goto :node_ok
if exist "%AppData%\npm\node.exe" set "PATH=%AppData%\npm;%PATH%" & goto :node_ok

echo.
echo ===============================================================================
echo [AVISO: O Node.js ainda nao esta instalado neste computador]
echo ===============================================================================
echo.
echo Para gerar o arquivo instalador final .exe, instale o Node.js:
echo 1. Baixe gratuitamente em: https://nodejs.org (Versao recomendada LTS).
echo 2. Apos instalar o Node.js, feche e abra este arquivo novamente.
echo.
echo DICA: Se voce quiser usar o sistema IMEDIATAMENTE sem instalar nada:
echo Dê 2 cliques no arquivo: ABRIR_SISTEMA_OFFLINE.bat
echo Ele abre o sistema completo offline direto no seu computador!
echo ===============================================================================
echo.
echo Pressione qualquer tecla para sair...
pause >nul
exit /b 1

:node_ok
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js detectado com sucesso: %NODE_VERSION%

:: 2. Limpeza preventiva
echo.
echo [Passo 2/4] Preparando pastas de destino...
if not exist "INSTALADOR_FINAL_PARA_O_CLIENTE" mkdir "INSTALADOR_FINAL_PARA_O_CLIENTE"
if exist "dist-electron" rmdir /s /q "dist-electron" >nul 2>&1

:: 3. Verificacao da interface compilada (dist)
echo.
echo [Passo 3/4] Verificando arquivos da interface...

if exist "dist\index.html" goto :dist_pronto

echo Compilando arquivos da interface...
if exist "node_modules\.bin\vite.cmd" goto :rodar_build
echo Instalando componentes necessarios...
call npm install --legacy-peer-deps --no-audit

:rodar_build
call npm run build

:dist_pronto
if exist "dist\index.html" goto :dist_confirmado
echo [ERRO] Nao foi possivel encontrar a pasta dist\index.html.
echo.
pause
exit /b 1

:dist_confirmado
echo [OK] Arquivos da interface 100%% prontos em dist\index.html!

:: 4. Instalacao do Electron e geracao do .exe
echo.
echo [Passo 4/4] Gerando instalador executavel .exe compacto...

if exist "node_modules\.bin\electron-builder.cmd" goto :builder_pronto
echo Baixando empacotador Electron Builder - primeira configuracao...
call npm install electron@33.2.1 electron-builder@25.1.8 --save-dev --legacy-peer-deps --no-audit

:builder_pronto
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo.
echo ===============================================================================
echo            CRIANDO O INSTALADOR .EXE PARA WINDOWS...
echo ===============================================================================
echo.

if exist "node_modules\.bin\electron-builder.cmd" goto :rodar_builder_local
call npx --yes electron-builder --win nsis -c.extraMetadata.main=electron-main.js -c.compression=maximum -c.win.signAndEditExecutable=false
goto :checar_resultado

:rodar_builder_local
call "node_modules\.bin\electron-builder.cmd" --win nsis -c.extraMetadata.main=electron-main.js -c.compression=maximum -c.win.signAndEditExecutable=false

:checar_resultado
if exist "dist-electron\*.exe" goto :sucesso_exe

echo.
echo ===============================================================================
echo [AVISO] O arquivo .exe nao foi gerado na pasta dist-electron.
echo Veja as mensagens exibidas acima nesta janela.
echo ===============================================================================
echo.
pause
exit /b 1

:sucesso_exe
copy /y "dist-electron\*.exe" "INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO_Instalador_Windows.exe" >nul 2>&1
if exist "dist-electron\win-unpacked" rmdir /s /q "dist-electron\win-unpacked" >nul 2>&1

echo.
echo ===============================================================================
echo               PARABENS! INSTALADOR WINDOWS GERADO COM SUCESSO!
echo ===============================================================================
echo.
echo O arquivo executavel pronto para enviar ao cliente esta em:
echo INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO_Instalador_Windows.exe
echo.
echo Voce pode enviar esse arquivo por WhatsApp, Pen Drive ou Google Drive.
echo O cliente clica nele e instala no computador dele, 100%% offline!
echo.
echo Abrindo a pasta do instalador agora...
start "" explorer "INSTALADOR_FINAL_PARA_O_CLIENTE"
echo.
echo Processo finalizado com sucesso! Pressione qualquer tecla para fechar.
pause >nul
exit /b 0
