@echo off
setlocal enabledelayedexpansion
pushd "%~dp0.."
set "RAIZ=%CD%"
title GERADOR OFICIAL DO APK - OSNIR TURISMO
color 0A
cls

echo ===============================================================================
echo            GERADOR AUTOMATICO DO APK (CELULAR) - OSNIR TURISMO
echo ===============================================================================
echo.

:: 1. Procurar instalacoes de Java 17 no sistema
echo 1. Procurando Java compativel (Java 17)...
set "JAVA_USAR="

if exist "%ProgramFiles%\Eclipse Adoptium" (
    for /d %%i in ("%ProgramFiles%\Eclipse Adoptium\jdk-17*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)
if "%JAVA_USAR%"=="" if exist "%ProgramFiles%\Java" (
    for /d %%i in ("%ProgramFiles%\Java\jdk-17*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)
if "%JAVA_USAR%"=="" if exist "%ProgramFiles%\Microsoft" (
    for /d %%i in ("%ProgramFiles%\Microsoft\jdk-17*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)
if "%JAVA_USAR%"=="" if exist "%ProgramFiles%\Amazon Corretto" (
    for /d %%i in ("%ProgramFiles%\Amazon Corretto\jdk17*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)
if "%JAVA_USAR%"=="" if exist "%ProgramFiles%\Android\Android Studio\jbr" (
    if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_USAR=%ProgramFiles%\Android\Android Studio\jbr"
)
if "%JAVA_USAR%"=="" if exist "%LocalAppData%\Programs\Android Studio\jbr" (
    if exist "%LocalAppData%\Programs\Android Studio\jbr\bin\java.exe" set "JAVA_USAR=%LocalAppData%\Programs\Android Studio\jbr"
)
if "%JAVA_USAR%"=="" if exist "%ProgramFiles%\Eclipse Adoptium" (
    for /d %%i in ("%ProgramFiles%\Eclipse Adoptium\jdk*") do (
        if exist "%%i\bin\java.exe" set "JAVA_USAR=%%i"
    )
)

if "%JAVA_USAR%"=="" (
    color 0C
    echo [ERRO] Java 17 nao foi encontrado automaticamente.
    echo Por favor, execute o arquivo INSTALAR_JAVA_17_AUTOMATICO.bat nesta pasta.
    echo.
    pause
    popd
    exit /b 1
)

echo [OK] Java 17 localizado em: "%JAVA_USAR%"
echo.

set "JAVA_HOME=%JAVA_USAR%"
set "PATH=%JAVA_USAR%\bin;%PATH%"

:: 2. Android SDK
echo 2. Configurando o Android SDK e Licencas...
set "LOCAL_SDK="
if exist "%LocalAppData%\Android\Sdk" set "LOCAL_SDK=%LocalAppData%\Android\Sdk"
if "%LOCAL_SDK%"=="" if exist "C:\Android\Sdk" set "LOCAL_SDK=C:\Android\Sdk"
if "%LOCAL_SDK%"=="" set "LOCAL_SDK=%LocalAppData%\Android\Sdk"

echo [OK] Usando Android SDK em: "%LOCAL_SDK%"
set "ANDROID_HOME=%LOCAL_SDK%"
set "ANDROID_SDK_ROOT=%LOCAL_SDK%"

if not exist "%LOCAL_SDK%" mkdir "%LOCAL_SDK%"
if not exist "%LOCAL_SDK%\licenses" mkdir "%LOCAL_SDK%\licenses"
> "%LOCAL_SDK%\licenses\android-sdk-license" echo 24333f8a63b6825ea9c5514f83c2829b004d1fee
>> "%LOCAL_SDK%\licenses\android-sdk-license" echo 84831b9409646a918e30573bab4c9c91346d8abd
>> "%LOCAL_SDK%\licenses\android-sdk-license" echo d56f5187479451eabf01fb78af6dfcb131a6481e
> "%LOCAL_SDK%\licenses\android-sdk-preview-license" echo 8564bc6a22f0579eabb74f91fa20c603b6d86fb0

if not exist "%RAIZ%\android\licenses" mkdir "%RAIZ%\android\licenses"
copy /y "%LOCAL_SDK%\licenses\*.*" "%RAIZ%\android\licenses\" >nul 2>&1

set "FORMATO_SDK=%LOCAL_SDK:\=/%"
echo sdk.dir=%FORMATO_SDK%> "%RAIZ%\android\local.properties"

echo.
echo 3. Verificando arquivos compilados do aplicativo...
if exist "%RAIZ%\dist\index.html" (
    echo [OK] Versao compilada estavel pronta encontrada em dist\!
) else (
    echo [INFO] Compilando arquivos do aplicativo...
    if not exist "%RAIZ%\node_modules" (
        echo [INFO] Baixando dependencias necessarias automaticamente...
        call npm install --no-audit --no-fund
    )
    call npm run build
    if !errorlevel! neq 0 (
        echo [INFO] Tentando compilacao direta com Vite...
        call npx --yes vite build
    )
)

if not exist "%RAIZ%\android\app\src\main\res\values\colors.xml" (
    (
        echo ^<?xml version="1.0" encoding="utf-8"?^>
        echo ^<resources^>
        echo     ^<color name="colorPrimary"^>#065f46^</color^>
        echo     ^<color name="colorPrimaryDark"^>#044e3a^</color^>
        echo     ^<color name="colorAccent"^>#10b981^</color^>
        echo ^</resources^>
    ) > "%RAIZ%\android\app\src\main\res\values\colors.xml"
)
(
    echo include ':capacitor-android'
    echo if ^(new File^('./capacitor-android/src/main/java'^).exists^(^)^) ^{
    echo     project^(':capacitor-android'^).projectDir = new File^('./capacitor-android'^)
    echo ^} else if ^(new File^('../node_modules/@capacitor/android/capacitor'^).exists^(^)^) ^{
    echo     project^(':capacitor-android'^).projectDir = new File^('../node_modules/@capacitor/android/capacitor'^)
    echo ^} else ^{
    echo     project^(':capacitor-android'^).projectDir = new File^('./capacitor-android'^)
    echo ^}
) > "%RAIZ%\android\capacitor.settings.gradle"

if not exist "%RAIZ%\android\app\src\main\assets\public" mkdir "%RAIZ%\android\app\src\main\assets\public"
if exist "%RAIZ%\android\app\src\main\assets\public\assets" rd /s /q "%RAIZ%\android\app\src\main\assets\public\assets" >nul 2>&1
del /q /f "%RAIZ%\android\app\src\main\assets\public\*.*" >nul 2>&1

if exist "%RAIZ%\dist\index.html" (
    xcopy /e /y /q "%RAIZ%\dist\*" "%RAIZ%\android\app\src\main\assets\public\" >nul 2>&1
    if exist "%RAIZ%\android\app\src\main\assets\public\webintoapp_pacote.zip" del /f /q "%RAIZ%\android\app\src\main\assets\public\webintoapp_pacote.zip" >nul 2>&1
)
echo [OK] Recursos do aplicativo sincronizados com a versao 100%% limpa (sem gerador)!

echo.
echo 4. Compilando o APK (Isso leva de 1 a 2 minutos)...
echo    Aguarde enquanto o Gradle gera o pacote do aplicativo...
echo -------------------------------------------------------------------------------

cd /d "%RAIZ%\android"
call gradlew.bat assembleDebug assembleRelease --stacktrace > "%RAIZ%\relatorio_erro_apk.txt" 2>&1
set "GRADLE_STATUS=%ERRORLEVEL%"
cd /d "%RAIZ%"

echo.
echo -------------------------------------------------------------------------------
echo Codigo de retorno da compilacao: %GRADLE_STATUS%
echo -------------------------------------------------------------------------------
echo.
set "DESTINO=%RAIZ%\SEU_APK_AQUI"

set "APK_ORIGEM="
if exist "%RAIZ%\android\app\build\outputs\apk\debug\app-debug.apk" (
    set "APK_ORIGEM=%RAIZ%\android\app\build\outputs\apk\debug\app-debug.apk"
)
if "%APK_ORIGEM%"=="" if exist "%RAIZ%\android\app\build\outputs\apk\release\app-release.apk" (
    set "APK_ORIGEM=%RAIZ%\android\app\build\outputs\apk\release\app-release.apk"
)
if "%APK_ORIGEM%"=="" if exist "%RAIZ%\android\app\build\outputs\apk\release\app-release-unsigned.apk" (
    set "APK_ORIGEM=%RAIZ%\android\app\build\outputs\apk\release\app-release-unsigned.apk"
)

if not "%APK_ORIGEM%"=="" (
    if not exist "%DESTINO%" mkdir "%DESTINO%"
    copy /y "%APK_ORIGEM%" "%DESTINO%\OSNIR_TURISMO.apk" >nul 2>&1

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
    color 0C
    echo ===============================================================================
    echo             HOUVE UM DETALHE NA COMPILACAO DO APK
    echo ===============================================================================
    echo.
    echo Veja abaixo o erro que o sistema relatou:
    echo -------------------------------------------------------------------------------
    if exist "%RAIZ%\relatorio_erro_apk.txt" (
        type "%RAIZ%\relatorio_erro_apk.txt"
        echo -------------------------------------------------------------------------------
        echo.
        echo Abrindo o relatorio completo no Bloco de Notas para facilitar...
        start "" notepad "%RAIZ%\relatorio_erro_apk.txt"
    ) else (
        echo Nao foi possivel ler o relatorio.
    )
)

:fim
echo.
echo Pressione qualquer tecla para fechar esta janela.
pause >nul
popd
exit /b 0
