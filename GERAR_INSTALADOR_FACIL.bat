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
echo ===============================================================================
echo 1. Verificando o ambiente Node.js...
echo ===============================================================================

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ALERTA] O Node.js nao foi detectado no PATH do Windows.
    echo Baixe e instale o Node.js LTS em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo [OK] Node.js detectado: %NODE_VER%
echo.

echo ===============================================================================
echo 2. Compilando os arquivos mais recentes do sistema (Vite)...
echo ===============================================================================
call npx vite build
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Falha ao compilar o sistema com o Vite.
    pause
    exit /b 1
)
echo [OK] Sistema compilado com sucesso na pasta dist!
echo.

echo ===============================================================================
echo 3. Gerando o instalador executavel (.exe) profissional para Windows...
echo    Aguarde cerca de 1 a 2 minutos enquanto o Electron empacota o instalador...
echo ===============================================================================
call npx electron-builder --win nsis
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Falha ao empacotar com o electron-builder.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo 4. Organizando o instalador final...
echo ===============================================================================

set "PASTA_FINAL=%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE"
if not exist "%PASTA_FINAL%" mkdir "%PASTA_FINAL%"

:: Copiar o instalador .exe gerado para a pasta limpa final
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
echo [x] Pronto para uso proprio ou para venda!
echo.
echo Abrindo a pasta do instalador agora mesmo na sua tela...
start "" explorer "%PASTA_FINAL%"
echo.
echo Pressione qualquer tecla para encerrar.
pause >nul
exit /b 0
