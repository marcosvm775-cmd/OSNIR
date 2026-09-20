@echo off
setlocal enabledelayedexpansion
title OSNIR TURISMO - Gerador de Instalador Celular Android (.APK)
color 0A
cls

echo ===============================================================================
echo            OSNIR TURISMO - GERADOR DE INSTALADOR CELULAR (.APK)
echo    Gera o arquivo .APK offline para instalar no celular sem dar acesso a conta!
echo ===============================================================================
echo.

:: 1. Verificacao do Node.js
echo [Passo 1/4] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
    if exist "%LocalAppData%\Programs\nodejs\node.exe" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale o Node.js em https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js ativo: !NODE_VERSION!

:: 2. Limpeza preventiva
echo.
echo [Passo 2/4] Preparando pastas limpas...
if not exist "INSTALADOR_FINAL_PARA_O_CLIENTE" mkdir "INSTALADOR_FINAL_PARA_O_CLIENTE"

:: 3. Verificacao de dependencias e compilacao da interface
echo.
echo [Passo 3/4] Verificando dependencias e compilando o sistema...

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
    echo [OK] Sistema compilado com sucesso em dist\index.html!
) else (
    echo.
    echo [ERRO] Nao foi possivel compilar dist\index.html.
    echo Verifique sua conexao com a internet para a instalacao inicial dos componentes.
    pause
    exit /b 1
)

:: 4. Preparacao do projeto nativo Android (Capacitor)
echo.
echo [Passo 4/4] Configurando ferramentas de empacotamento Android...
call npm install @capacitor/core@6.2.0 @capacitor/cli@6.2.0 @capacitor/android@6.2.0 --save-dev --legacy-peer-deps --no-audit

:: Inicializa o projeto Android se ainda nao existir
if not exist "capacitor.config.json" (
    echo Criando configuracao do aplicativo Android...
    node -e "const fs = require('fs'); const config = { appId: 'com.osnirturismo.app', appName: 'OSNIR TURISMO', webDir: 'dist', server: { androidScheme: 'https' } }; fs.writeFileSync('capacitor.config.json', JSON.stringify(config, null, 2));"
)

if not exist "android" (
    echo Adicionando plataforma nativa Android...
    call npx cap add android
) else (
    echo Sincronizando arquivos atualizados com o aplicativo Android...
    call npx cap sync android
)

echo.
echo ===============================================================================
echo                CONFIGURACAO DO APLICATIVO ANDROID CONCLUIDA!
echo ===============================================================================
echo.
echo O codigo offline e o banco de dados interno ja foram inseridos dentro da pasta 'android'.
echo.
echo Escolha como deseja gerar o arquivo .APK final:
echo.
echo  [1] COMPILAR COM O GRADLE DO ANDROID (Gera o arquivo .apk direto no terminal)
echo  [2] ABRIR NO ANDROID STUDIO (Recomendado se voce tiver o Android Studio instalado)
echo  [3] GERAR PACOTE PRONTO PARA O SITE GRATUITO (Gera .apk em 1 minuto pelo navegador)
echo.
set /p OPCAO="Digite a opcao desejada (1, 2 ou 3): "

if "%OPCAO%"=="1" goto :compilar_gradle
if "%OPCAO%"=="2" goto :abrir_studio
if "%OPCAO%"=="3" goto :gerador_online

:compilar_gradle
echo.
echo Tentando compilar APK com Gradle...
cd android
if exist "gradlew.bat" (
    call gradlew.bat assembleDebug
    cd ..
    if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
        copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO_Celular_Android.apk" >nul 2>&1
        goto :sucesso_apk
    ) else (
        echo.
        echo [AVISO] Nao foi possivel compilar diretamente sem o Android SDK instalado.
        goto :abrir_studio
    )
) else (
    cd ..
    goto :abrir_studio
)

:abrir_studio
echo.
echo Abrindo o projeto no Android Studio...
echo No Android Studio, va no menu: Build -^> Build Bundle(s) / APK(s) -^> Build APK(s)
call npx cap open android
pause
exit /b 0

:gerador_online
echo.
echo Criando pacote compactado para geracao instantanea de APK...
node -e "console.log('Pacote pronto na pasta dist. Voce pode usar o gerador online.');"
start https://www.pwabuilder.com
goto :fim

:sucesso_apk
echo.
echo ===============================================================================
echo           PARABENS! ARQUIVO .APK PARA CELULAR GERADO COM SUCESSO!
echo ===============================================================================
echo.
echo O instalador para celular pronto para enviar ao cliente esta em:
echo INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO_Celular_Android.apk
echo.
echo Esse arquivo .APK pode ser enviado pelo WhatsApp, Bluetooth, Pen Drive ou Google Drive!
echo O cliente clica no .APK no celular dele e instala direto, sem ver sua conta nem seu codigo!
echo.
start "" explorer INSTALADOR_FINAL_PARA_O_CLIENTE
pause
exit /b 0

:fim
pause
