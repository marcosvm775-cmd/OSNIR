@echo off
title GERADOR DE APK DIRETO - OSNIR TURISMO
color 0B
cls

echo ===============================================================================
echo        GERADOR DE APK DIRETO (SEM PRECISAR MEXER NO ANDROID STUDIO)
echo ===============================================================================
echo.
echo Este script vai compilar o arquivo .APK para voce direto no Windows!
echo.

:: 1. Procurar onde o Android Studio instalou o Java
set "MY_JAVA="

if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" (
    set "MY_JAVA=%ProgramFiles%\Android\Android Studio\jbr"
) else if exist "%LocalAppData%\Programs\Android Studio\jbr\bin\java.exe" (
    set "MY_JAVA=%LocalAppData%\Programs\Android Studio\jbr"
) else if exist "%ProgramFiles%\Android\Android Studio\jre\bin\java.exe" (
    set "MY_JAVA=%ProgramFiles%\Android\Android Studio\jre"
) else if exist "%ProgramFiles(x86)%\Android\Android Studio\jbr\bin\java.exe" (
    set "MY_JAVA=%ProgramFiles(x86)%\Android\Android Studio\jbr"
) else if defined JAVA_HOME (
    set "MY_JAVA=%JAVA_HOME%"
)

if not defined MY_JAVA (
    echo [ERRO] Nao encontramos a pasta do Java do Android Studio.
    echo Certifique-se de que o Android Studio esta instalado no seu computador.
    echo.
    pause
    exit /b 1
)

echo [1/3] Java encontrado com sucesso em:
echo       "%MY_JAVA%"
echo.

:: 2. Procurar o SDK do Android
set "MY_SDK="
if exist "%LocalAppData%\Android\Sdk\platform-tools" (
    set "MY_SDK=%LocalAppData%\Android\Sdk"
) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools" (
    set "MY_SDK=%USERPROFILE%\AppData\Local\Android\Sdk"
) else if defined ANDROID_HOME (
    set "MY_SDK=%ANDROID_HOME%"
)

if not defined MY_SDK (
    echo [AVISO] SDK padrao nao localizado automaticamente, usando caminho padrao do Windows...
    set "MY_SDK=%LocalAppData%\Android\Sdk"
)

echo [2/3] Configurando caminho do Android SDK...
set "ESCAPED_SDK=%MY_SDK:\=\\%"
echo sdk.dir=%ESCAPED_SDK%> "%~dp0android\local.properties"

:: 3. Executar a compilacao
echo.
echo [3/3] INICIANDO A COMPILACAO DO SEU ARQUIVO .APK AGORA!
echo       Por favor, aguarde de 1 a 2 minutos enquanto o Windows gera o instalador...
echo.

set "JAVA_HOME=%MY_JAVA%"
set "PATH=%MY_JAVA%\bin;%PATH%"

cd /d "%~dp0android"
call gradlew.bat assembleDebug

cd /d "%~dp0"

echo.
if exist "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" (
    if not exist "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE" mkdir "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE"
    copy /y "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO.apk" >nul 2>&1

    echo ===============================================================================
    echo          VITORIA! SEU ARQUIVO .APK FOI GERADO COM SUCESSO!
    echo ===============================================================================
    echo.
    echo O arquivo esta pronto para ser instalado no celular e esta salvo em:
    echo %~dp0INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO.apk
    echo.
    echo Abrindo a pasta do arquivo agora para voce enviar pelo WhatsApp...
    start "" explorer "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE"
) else (
    echo ===============================================================================
    echo             HOUVE UM ERRO AO GERAR O APK VIA TERMINAL
    echo ===============================================================================
    echo Veja as linhas acima para entender o que faltou baixar.
)

echo.
echo Pressione qualquer tecla para sair desta janela...
pause >nul
exit /b 0
