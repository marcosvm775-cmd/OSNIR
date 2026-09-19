@echo off
title OSNIR TURISMO - Gerador de Instalador Windows (.exe)
color 0B
cls

echo ===============================================================================
echo                OSNIR TURISMO - GERADOR DE INSTALADOR (.EXE)
echo ===============================================================================
echo.

echo [Passo 1/4] Verificando ambiente Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERRO FATAL] O Node.js nao esta instalado neste computador!
    echo.
    echo Para resolver facilmente:
    echo 1. Acesse https://nodejs.org/ e baixe a versao "LTS" (Recomendada).
    echo 2. Instale normalmente (Avancar, Avancar, Concluir).
    echo 3. Feche esta janela e execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js detectado com sucesso!

echo.
echo [Passo 2/4] Instalando dependencias do sistema...
call npm install
if %errorlevel% neq 0 (
    echo [AVISO] Tentando instalar com permissao flexivel...
    call npm install --force
)

echo.
echo [Passo 3/4] Compilando as telas e modulos do sistema (Vite Build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar os arquivos do sistema.
    echo Veja o erro acima.
    pause
    exit /b 1
)
echo [OK] Telas compiladas na pasta dist com sucesso!

echo.
echo [Passo 4/4] Instalando o empacotador de executavel e criando instalador Windows...
call npm install electron@^33.2.1 electron-builder@^25.1.8 --save-dev

echo.
echo Gerando o instalador final .exe (NSIS)...
call npx electron-builder --win nsis -c.extraMetadata.main=electron-main.js

if exist "dist-electron\*.exe" (
    echo.
    echo ===============================================================================
    echo               PARABENS! INSTALADOR WINDOWS GERADO COM SUCESSO!
    echo ===============================================================================
    echo.
    echo O arquivo executavel pronto para uso ou envio ao cliente esta em:
    echo.
    dir /b dist-electron\*.exe
    echo.
    echo Abrindo a pasta para voce...
    explorer dist-electron
) else (
    echo.
    echo ===============================================================================
    echo [ATENCAO] Ocorreu uma mensagem durante a criacao do .exe.
    echo Veja as linhas de log acima para identificar o motivo.
    echo ===============================================================================
)

echo.
pause
