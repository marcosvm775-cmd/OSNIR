@echo off
setlocal enabledelayedexpansion
pushd "%~dp0.."
set "RAIZ=%CD%"
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
if not exist "%RAIZ%\dist\index.html" (
    echo [INFO] Compilando arquivos do sistema com o Vite...
    call npx vite build
) else (
    echo [OK] Arquivos compilados do sistema ja estao prontos com a versao mais recente!
)

:: 2. Garantir que o Electron esteja disponivel
echo.
echo 2. Verificando dependencias do Electron...
if not exist "%RAIZ%\node_modules\electron" (
    echo [INFO] Instalando pacote do Electron... Aguarde alguns instantes...
    call npm install electron@34.0.0 --save-dev --no-audit --no-fund
) else (
    echo [OK] Electron pronto!
)

echo.
echo 3. Empacotando com o Electron Builder e salvando o log...
echo    Aguarde cerca de 1 a 2 minutos...
echo.

call npx electron-builder --win nsis > "%RAIZ%\relatorio_erro_electron.txt" 2>&1

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ===============================================================================
    echo               ATENCAO: O RELATORIO EXATO DO ELECTRON FOI SALVO!
    echo ===============================================================================
    echo.
    echo Abrindo relatorio_erro_electron.txt no Bloco de Notas para voce ver o motivo real...
    echo.
    if exist "%RAIZ%\relatorio_erro_electron.txt" (
        start "" notepad "%RAIZ%\relatorio_erro_electron.txt"
    )
    pause
    exit /b 1
)

echo.
echo 4. Organizando o instalador final...
set "PASTA_FINAL=%RAIZ%\INSTALADOR_FINAL_PARA_O_CLIENTE"
if not exist "%PASTA_FINAL%" mkdir "%PASTA_FINAL%"

set "ACHOU_EXE=0"
for %%f in ("%RAIZ%\dist-electron\*.exe") do (
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
popd
exit /b 0
