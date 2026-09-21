@echo off
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
    echo [ERRO] Java 17 nao foi localizado nas pastas do Windows.
    echo Se voce acabou de rodar o INSTALAR_JAVA_17_AUTOMATICO.bat, confirme se ele terminou.
    echo.
    pause
    goto fim
)

echo [OK] Java localizado com sucesso em:
echo      "%JAVA_USAR%"
echo.
"%JAVA_USAR%\bin\java.exe" -version
echo.

set "JAVA_HOME=%JAVA_USAR%"
set "PATH=%JAVA_USAR%\bin;%SystemRoot%\system32;%SystemRoot%"

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

if not exist "%~dp0android\licenses" mkdir "%~dp0android\licenses"
copy /y "%LOCAL_SDK%\licenses\*.*" "%~dp0android\licenses\" >nul 2>&1

set "FORMATO_SDK=%LOCAL_SDK:\=/%"
echo sdk.dir=%FORMATO_SDK%> "%~dp0android\local.properties"

echo.
echo 3. Compilando o APK (Isso leva de 1 a 2 minutos)...
echo    Por favor aguarde enquanto o Gradle constroi o instalador...
echo.

cd /d "%~dp0android"
call gradlew.bat clean assembleDebug --stacktrace > "%~dp0relatorio_erro_apk.txt" 2>&1
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
    color 0C
    echo ===============================================================================
    echo             HOUVE UM DETALHE NA COMPILACAO DO APK
    echo ===============================================================================
    echo.
    echo O relatorio detalhado do erro foi gerado em: relatorio_erro_apk.txt
    echo Abrindo o bloco de notas agora...
    echo.
    if exist "%~dp0relatorio_erro_apk.txt" (
        start "" notepad "%~dp0relatorio_erro_apk.txt"
    )
)

:fim
echo.
echo Pressione qualquer tecla para fechar esta janela.
pause >nul
exit /b 0
