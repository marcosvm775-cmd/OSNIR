@echo off
setlocal enabledelayedexpansion
title OSNIR TURISMO - Gerador de Instalador Windows (.exe)
color 0B
cls

echo ===============================================================================
echo                OSNIR TURISMO - GERADOR DE INSTALADOR (.EXE)
echo ===============================================================================
echo.

:: 1. Verificacao inteligente do Node.js
echo [Passo 1/3] Localizando o Node.js no seu computador...

where node >nul 2>&1
if %errorlevel% equ 0 (
    goto :node_found
)

if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    goto :node_found
)

if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    goto :node_found
)

if exist "%LocalAppData%\Programs\nodejs\node.exe" (
    set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
    goto :node_found
)

if exist "%AppData%\npm\node.exe" (
    set "PATH=%AppData%\npm;%PATH%"
    goto :node_found
)

echo.
echo ===============================================================================
echo [AVISO: O Node.js nao foi detectado automaticamente no PATH]
echo ===============================================================================
echo Se o Node.js esta em uma pasta diferente, digite o caminho da pasta:
set /p USER_NODE_DIR="Caminho da pasta do Node.js: "

if defined USER_NODE_DIR (
    if exist "!USER_NODE_DIR!\node.exe" (
        set "PATH=!USER_NODE_DIR!;!PATH!"
        goto :node_found
    )
)

echo.
echo [ERRO FATAL] O Node.js nao foi localizado.
echo Por favor, reinicie o computador uma vez apos instalar o Node.js.
pause
exit /b 1

:node_found
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js ativo e pronto: !NODE_VERSION!

:: 2. Limpeza preventiva de builds antigos e cache (evita instalador gigante acima de 1GB)
echo.
echo Limpando arquivos temporarios e builds anteriores...
if exist "dist-electron" rmdir /s /q "dist-electron" >nul 2>&1
if exist "INSTALADOR_FINAL_PARA_O_CLIENTE" rmdir /s /q "INSTALADOR_FINAL_PARA_O_CLIENTE" >nul 2>&1
if exist "%LocalAppData%\electron-builder\Cache\winCodeSign" (
    rmdir /s /q "%LocalAppData%\electron-builder\Cache\winCodeSign" >nul 2>&1
)

:: 3. Verificacao de dependencias e compilacao da interface
echo.
echo [Passo 2/3] Verificando dependencias e compilando o sistema...

if not exist "node_modules\.bin\vite.cmd" (
    echo.
    echo Baixando e preparando componentes necessarios (Vite e bibliotecas)...
    echo Isso so ocorre na primeira vez. Por favor, aguarde alguns instantes...
    call npm install --legacy-peer-deps --no-audit
)

if exist "node_modules\.bin\vite.cmd" (
    call "node_modules\.bin\vite.cmd" build
) else (
    call npm run build
)

if not exist "dist\index.html" (
    echo.
    echo Tentando compilar via npx...
    call npx --yes vite build
)

if exist "dist\index.html" (
    echo [OK] Arquivos da interface compilados e otimizados com sucesso em dist\index.html!
) else (
    echo.
    echo [ERRO] Nao foi possivel compilar dist\index.html.
    echo Verifique sua conexao com a internet para a instalacao inicial dos componentes.
    pause
    exit /b 1
)

:: 4. Instalacao do Electron e geracao direta do .exe compacto
echo.
echo [Passo 3/3] Preparando empacotador Electron com compressao maxima (tamanho reduzido)...
if not exist "node_modules\.bin\electron-builder.cmd" (
    echo Instalando empacotador Electron...
    call npm install electron@33.2.1 electron-builder@25.1.8 --save-dev --legacy-peer-deps --no-audit
)

:: Desativa verificacao de assinatura digital que tenta extrair binarios darwin no Windows
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo.
echo ===============================================================================
echo            CRIANDO O INSTALADOR EXECUTAVEL (.EXE) COMPACTADO...
echo   (Compressao maxima sem pastas node_modules desnecessarias: ~75 MB a 85 MB)
echo ===============================================================================
echo.

if exist "node_modules\.bin\electron-builder.cmd" (
    call "node_modules\.bin\electron-builder.cmd" --win nsis -c.extraMetadata.main=electron-main.js -c.compression=maximum -c.files="dist/**/*" -c.files="electron-main.js" -c.files="package.json" -c.files="!node_modules/**/*" -c.win.signAndEditExecutable=false
) else (
    call npx --yes electron-builder --win nsis -c.extraMetadata.main=electron-main.js -c.compression=maximum -c.files="dist/**/*" -c.files="electron-main.js" -c.files="package.json" -c.files="!node_modules/**/*" -c.win.signAndEditExecutable=false
)

if exist "dist-electron\*.exe" (
    echo.
    echo Criando pasta limpa com o instalador final...
    if not exist "INSTALADOR_FINAL_PARA_O_CLIENTE" mkdir "INSTALADOR_FINAL_PARA_O_CLIENTE"
    copy /y "dist-electron\*.exe" "INSTALADOR_FINAL_PARA_O_CLIENTE\" >nul 2>&1

    :: Remove pasta descompactada win-unpacked que ocupa espaco inutilmente
    if exist "dist-electron\win-unpacked" rmdir /s /q "dist-electron\win-unpacked" >nul 2>&1

    echo.
    echo ===============================================================================
    echo               PARABENS! INSTALADOR WINDOWS GERADO COM SUCESSO!
    echo ===============================================================================
    echo.
    echo O seu instalador .exe leve (apenas ~75MB a 85MB) pronto para o cliente esta em:
    echo.
    dir /b /s INSTALADOR_FINAL_PARA_O_CLIENTE\*.exe
    echo.
    echo [IMPORTANTE]:
    echo Para vender e instalar nos seus clientes, voce so precisa enviar esse unico
    echo arquivo executavel (.exe). Nao precisa enviar nenhuma outra pasta!
    echo.
    echo Abrindo a pasta do instalador final...
    start "" explorer INSTALADOR_FINAL_PARA_O_CLIENTE
) else (
    echo.
    echo ===============================================================================
    echo [FALHA NA GERACAO] O arquivo .exe nao foi encontrado.
    echo Veja as mensagens acima para diagnosticar.
    echo ===============================================================================
)

echo.
pause
