@echo off
if not "%~1"=="__CONSOLE__" (
    start "" cmd /k ""%~f0" __CONSOLE__"
    exit /b
)

title OSNIR TURISMO - Gerador Automatico de APK
color 0A
cls

echo ===============================================================================
echo            OSNIR TURISMO - GERADOR AUTOMATICO DE APK ANDROID
echo ===============================================================================
echo.
echo Pasta do projeto: %~dp0
echo.

cd /d "%~dp0"

:: 1. Tenta detectar o Java do Android Studio ou do sistema
echo [1/3] Procurando instalacao do Java e Android Studio...

set "JAVA_BIN="
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_BIN=%ProgramFiles%\Android\Android Studio\jbr"
if not defined JAVA_BIN if exist "%ProgramFiles%\Android\Android Studio\jre\bin\java.exe" set "JAVA_BIN=%ProgramFiles%\Android\Android Studio\jre"
if not defined JAVA_BIN if exist "%LocalAppData%\Programs\Android Studio\jbr\bin\java.exe" set "JAVA_BIN=%LocalAppData%\Programs\Android Studio\jbr"
if not defined JAVA_BIN if exist "%ProgramFiles(x86)%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_BIN=%ProgramFiles(x86)%\Android\Android Studio\jbr"

if not defined JAVA_BIN if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" set "JAVA_BIN=%JAVA_HOME%"
)

if not defined JAVA_BIN (
    where java >nul 2>&1
    if %errorlevel% equ 0 for /f "tokens=*" %%i in ('where java') do set "JAVA_BIN=%%~dpi.."
)

if defined JAVA_BIN (
    echo [OK] Java detectado em: %JAVA_BIN%
) else (
    echo [AVISO] Java do Android Studio nao foi encontrado nas pastas padrao.
)

:: 2. Tenta detectar o Android SDK
echo.
echo [2/3] Procurando Android SDK...

set "SDK_DIR="
if exist "%LocalAppData%\Android\Sdk\platform-tools" set "SDK_DIR=%LocalAppData%\Android\Sdk"
if not defined SDK_DIR if exist "%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools" set "SDK_DIR=%USERPROFILE%\AppData\Local\Android\Sdk"
if not defined SDK_DIR if defined ANDROID_HOME if exist "%ANDROID_HOME%\platform-tools" set "SDK_DIR=%ANDROID_HOME%"

if defined SDK_DIR (
    echo [OK] Android SDK detectado em: %SDK_DIR%
) else (
    echo [AVISO] Pasta do Android SDK nao encontrada nas pastas padrao.
)

:: 3. Se achou Java ou SDK, tenta rodar o Gradle direto
echo.
echo [3/3] Verificando se o APK ja existe ou compilando agora...

if exist "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo [SUCESSO] O arquivo APK ja estava compilado!
    goto :copiar_apk_sucesso
)

if not defined JAVA_BIN goto :mostrar_instrucoes_simples

set "JAVA_HOME=%JAVA_BIN%"
set "PATH=%JAVA_BIN%\bin;%PATH%"

if defined SDK_DIR (
    set "ANDROID_HOME=%SDK_DIR%"
    echo sdk.dir=%SDK_DIR:\=\\%> "%~dp0android\local.properties"
)

echo.
echo ===============================================================================
echo      COMPILANDO O APK AGORA... POR FAVOR AGUARDE CERCA DE 1 MINUTO...
echo ===============================================================================
echo.

cd "%~dp0android"
call gradlew.bat assembleDebug
cd "%~dp0"

if exist "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" goto :copiar_apk_sucesso

:mostrar_instrucoes_simples
echo.
echo ===============================================================================
echo             COMO GERAR O APK COM O ANDROID STUDIO ABERTO
echo ===============================================================================
echo.
echo Se o Android Studio ja esta aberto na sua tela, faca apenas isto:
echo.
echo 1. Va la no topo da tela do Android Studio no menu: Build
echo 2. Passe o mouse em: Build Bundle(s) / APK(s)
echo 3. Clique em: Build APK(s)
echo.
echo Depois de 1 minuto, no cantinho direito de baixo da tela:
echo Clique na palavrinha azul sublinhada chamada "locate".
echo Ela abre a pasta direto com o arquivo app-debug.apk pronto!
echo.
echo ===============================================================================
echo Esta janela NUNCA fecha sozinha. Voce pode ler com calma.
echo Pressione qualquer tecla quando terminar.
pause
exit /b 0

:copiar_apk_sucesso
if not exist "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE" mkdir "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE"
copy /y "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO_Celular.apk" >nul 2>&1

echo.
echo ===============================================================================
echo            PARABENS! O ARQUIVO .APK FOI GERADO COM SUCESSO!
echo ===============================================================================
echo.
echo O arquivo pronto para enviar ao cliente esta em:
echo INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO_Celular.apk
echo.
echo Abrindo a pasta do arquivo agora...
start "" explorer "%~dp0INSTALADOR_FINAL_PARA_O_CLIENTE"
echo.
echo Pressione qualquer tecla para fechar...
pause
exit /b 0
