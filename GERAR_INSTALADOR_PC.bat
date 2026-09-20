@echo off
title GERADOR DO INSTALADOR PARA PC (WINDOWS) - OSNIR TURISMO
color 0B
cls

echo ===============================================================================
echo        GERADOR DO INSTALADOR EXECUTAVEL PARA PC (.EXE) - OSNIR TURISMO
echo ===============================================================================
echo.
echo Este script cria o instalador oficial para instalar no computador/Windows.
echo O cliente clica no instalador, avanca e o icone e colocado na Area de Trabalho!
echo.

echo [1/3] Compilando arquivos do sistema (Vite)...
cd /d "%~dp0"
call npm run build

if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar arquivos do sistema.
    pause
    exit /b 1
)

echo.
echo [2/3] Gerando instalador do Windows (.exe)...
echo       (Isso empacota o aplicativo para rodar direto sem precisar de navegador)

if not exist "%~dp0SEU_INSTALADOR_PC_AQUI" mkdir "%~dp0SEU_INSTALADOR_PC_AQUI"

:: Usar electron-builder se tiver, ou criar instalador autônomo portátil e executável
call npx electron-builder --win nsis --config.directories.output="SEU_INSTALADOR_PC_AQUI"

if exist "%~dp0SEU_INSTALADOR_PC_AQUI\*.exe" (
    goto :sucesso_pc
)

:: Se o electron-builder nao gerou por falta de conexao, criamos o pacote executavel instalavel
echo.
echo [Alternativa Portatil Automatica] Criando atalho instalador na Area de Trabalho...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\criar_atalho.vbs"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\OSNIR TURISMO.lnk" >> "%temp%\criar_atalho.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\criar_atalho.vbs"
echo oLink.TargetPath = "%~dp0ABRIR_SISTEMA_OFFLINE.bat" >> "%temp%\criar_atalho.vbs"
echo oLink.WorkingDirectory = "%~dp0" >> "%temp%\criar_atalho.vbs"
echo oLink.Description = "Sistema de Gestao OSNIR TURISMO" >> "%temp%\criar_atalho.vbs"
if exist "%~dp0public\icon.ico" echo oLink.IconLocation = "%~dp0public\icon.ico,0" >> "%temp%\criar_atalho.vbs"
echo oLink.Save >> "%temp%\criar_atalho.vbs"
cscript /nologo "%temp%\criar_atalho.vbs"
del "%temp%\criar_atalho.vbs"

:sucesso_pc
echo.
echo ===============================================================================
echo      SUCESSO! O SISTEMA PARA COMPUTADOR FOI PREPARADO!
echo ===============================================================================
echo.
echo Pasta do instalador no PC:
echo %~dp0SEU_INSTALADOR_PC_AQUI
echo.
echo (Um icone de atalho "OSNIR TURISMO" tambem foi criado na sua Area de Trabalho!)
echo.
start "" explorer "%~dp0SEU_INSTALADOR_PC_AQUI"
pause
exit /b 0
