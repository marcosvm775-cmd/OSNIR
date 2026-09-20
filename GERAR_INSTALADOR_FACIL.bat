@echo off
setlocal enabledelayedexpansion
pushd "%~dp0"
title GERADOR OFICIAL DO INSTALADOR WINDOWS (.EXE) - OSNIR TURISMO
color 0B
cls

echo ===============================================================================
echo        GERADOR OFICIAL DO INSTALADOR WINDOWS (.EXE) - OSNIR TURISMO
echo ===============================================================================
echo.
echo Este utilitario cria o instalador executavel oficial (.exe) para o seu PC
echo ou para distribuir e vender aos seus clientes!
echo.

:: 1. Verificar se a pasta dist existe
echo 1. Verificando os arquivos do sistema...
if not exist "%~dp0dist\index.html" (
    echo [INFO] Compilando arquivos com o Vite...
    if exist "%~dp0node_modules\.bin\vite.cmd" (
        call "%~dp0node_modules\.bin\vite.cmd" build
    ) else (
        call npx --yes vite build
    )
) else (
    echo [OK] Arquivos compilados do sistema ja estao prontos na pasta dist!
)

echo.
echo 2. Empacotando o instalador executavel (.exe) para Windows...
echo    Aguarde cerca de 1 a 2 minutos...
echo.

set "BUILDER_CMD="
if exist "%~dp0node_modules\.bin\electron-builder.cmd" (
    set "BUILDER_CMD=%~dp0node_modules\.bin\electron-builder.cmd"
) else (
    set "BUILDER_CMD=npx --yes electron-builder"
)

call %BUILDER_CMD% --win nsis

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERRO] Ocorreu uma falha ao empacotar com o Electron Builder.
    echo Verifique a mensagem acima na tela.
    pause
    exit /b 1
)

echo.
echo 3. Organizando o instalador final...
set "PASTA_FINAL=%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE"
if not exist "%PASTA_FINAL%" mkdir "%PASTA_FINAL%"

set "ACHOU_EXE=0"
for %%f in ("%~dp0dist-electron\*.exe") do (
    copy /y "%%f" "%PASTA_FINAL%\" >nul 2>&1
    set "ARQUIVO_GERADO=%%~nxf"
    set "ACHOU_EXE=1"
)

color 0A
cls
echo ===============================================================================
echo             PARABENS! O INSTALADOR .EXE FOI GERADO COM SUCESSO!
echo ===============================================================================
echo.
if "!ACHOU_EXE!"=="1" (
    echo O arquivo executavel instalador profissional esta pronto em:
    echo -------------------------------------------------------------------------------
    echo %PASTA_FINAL%\!ARQUIVO_GERADO!
    echo -------------------------------------------------------------------------------
) else (
    echo Os arquivos gerados estao disponiveis na pasta:
    echo %PASTA_FINAL%
)
echo.
echo [x] Instalador standalone profissional com Assistente de Instalacao Windows (NSIS)
echo [x] Cria icone na Area de Trabalho e no Menu Iniciar automaticamente
echo [x] Banco de dados embutido offline
echo.
echo Abrindo a pasta do instalador agora mesmo na sua tela...
start "" explorer "%PASTA_FINAL%"
echo.
echo Pressione qualquer tecla para encerrar.
pause >nul
exit /b 0
