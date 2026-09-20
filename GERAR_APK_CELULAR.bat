@echo off
setlocal enabledelayedexpansion
title GERADOR OFICIAL DO APK - OSNIR TURISMO
color 0A
cls

echo ===============================================================================
echo            GERADOR AUTOMATICO DO APK (CELULAR) - OSNIR TURISMO
echo ===============================================================================
echo.

:: 1. Limpar ambiente para evitar conflitos
set "JAVA_HOME="
set "PATH=%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem"

echo 1. Localizando o Java 17 no seu computador...
set "JAVA_USAR="

for /d %%i in ("%ProgramFiles%\Eclipse Adoptium\jdk*") do (
    if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
)
if not defined JAVA_USAR (
    for /d %%i in ("%ProgramFiles%\Java\jdk*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)
if not defined JAVA_USAR (
    for /d %%i in ("%ProgramFiles%\Microsoft\jdk*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)
if not defined JAVA_USAR (
    for /d %%i in ("%ProgramFiles(x86)%\Eclipse Adoptium\jdk*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)

if not defined JAVA_USAR (
    color 0C
    echo [ERRO] Java 17 nao localizado.
    pause
    exit /b 1
)

echo [OK] Java pronto em: "%JAVA_USAR%"
set "JAVA_HOME=%JAVA_USAR%"
set "PATH=%JAVA_USAR%\bin;%SystemRoot%\system32;%SystemRoot%"

:: 2. Localizar o Android SDK
echo 2. Configurando o Android SDK...

set "LOCAL_SDK="

if exist "%LocalAppData%\Android\Sdk\platform-tools" (
    set "LOCAL_SDK=%LocalAppData%\Android\Sdk"
) else if exist "%LocalAppData%\Android\Sdk" (
    set "LOCAL_SDK=%LocalAppData%\Android\Sdk"
) else if exist "C:\Android\Sdk" (
    set "LOCAL_SDK=C:\Android\Sdk"
)

if defined LOCAL_SDK (
    echo [OK] Android SDK localizado em: "!LOCAL_SDK!"
    set "ANDROID_HOME=!LOCAL_SDK!"
    set "ANDROID_SDK_ROOT=!LOCAL_SDK!"
    
    :: Criar local.properties com barras normais
    set "FORMATO_SDK=!LOCAL_SDK:\=/!"
    echo sdk.dir=!FORMATO_SDK!> "%~dp0android\local.properties"
    
    :: Aceitar licencas
    if not exist "!LOCAL_SDK!\licenses" mkdir "!LOCAL_SDK!\licenses"
    > "!LOCAL_SDK!\licenses\android-sdk-license" echo 24333f8a63b6825ea9c5514f83c2829b004d1fee
    >> "!LOCAL_SDK!\licenses\android-sdk-license" echo 84831b9409646a918e30573bab4c9c91346d8abd
    >> "!LOCAL_SDK!\licenses\android-sdk-license" echo d56f5187479451eabf01fb78af6dfcb131a6481e
)

echo.
echo 3. Compilando o APK com diagnostico detalhado...
echo.

cd /d "%~dp0android"
call gradlew.bat assembleDebug --info
cd /d "%~dp0"

echo.
set "DESTINO=%~dp0SEU_APK_AQUI"

if exist "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" (
    if not exist "%DESTINO%" mkdir "%DESTINO%"
    copy /y "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" "%DESTINO%\OSNIR_TURISMO.apk" >nul 2>&1

    color 0A
    echo ===============================================================================
    echo                     VITORIA! O APK FOI GERADO COM SUCESSO!
    echo ===============================================================================
    echo.
    echo O arquivo instalador do CELULAR esta pronto em:
    echo -------------------------------------------------------------------------------
    echo %DESTINO%\OSNIR_TURISMO.apk
    echo -------------------------------------------------------------------------------
    echo.
    echo Abrindo a pasta na sua tela agora para voce enviar pelo WhatsApp...
    start "" explorer "%DESTINO%"
) else (
    echo ===============================================================================
    echo               ATENCAO: COPIE A MENSAGEM DO ERRO ACIMA
    echo ===============================================================================
    echo.
    echo Olhe as linhas acima deste aviso. Copie as ultimas linhas para sabermos o motivo exato.
    echo.
)

echo Pressione qualquer tecla para sair desta janela.
pause >nul
exit /b 0
