@echo off
title GERADOR OFICIAL DO APK (CELULAR) - OSNIR TURISMO
color 0A
cls

echo ===============================================================================
echo            GERADOR OFICIAL DO APK (CELULAR) - OSNIR TURISMO
echo ===============================================================================
echo.

:: ==============================================================================
:: PASSO 1: MATAR O VILAO DA PASTA JBR CORROMPIDA DO ANDROID STUDIO
:: ==============================================================================
echo [1/3] Verificando e neutralizando pastas corrompidas do Java...

:: Se existir a pasta corrompida do Android Studio, vamos renomea-la para nao atrapalhar
if exist "C:\Program Files\Android\Android Studio\jbr\lib\jvm.cfg" (
    echo A pasta jbr original esta com jvm.cfg corrompido.
) else if exist "C:\Program Files\Android\Android Studio\jbr" (
    echo [Protecao] Desativando pasta jbr corrompida para liberar o Java saudavel...
    ren "C:\Program Files\Android\Android Studio\jbr" "jbr_velho" >nul 2>&1
)

:: Forcar limpeza total das variaveis de ambiente na sessao atual
set "JAVA_HOME="
set "PATH=%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem"

:: ==============================================================================
:: PASSO 2: LOCALIZAR O JAVA SAUDAVEL INSTALADO NO COMPUTADOR
:: ==============================================================================
echo [2/3] Localizando o Java 17 funcional...

set "JAVA_DEFINITIVO="

:: 1. Procurar Temurin / Adoptium (O instalador oficial que baixamos)
for /d %%i in ("%ProgramFiles%\Eclipse Adoptium\jdk*") do (
    if exist "%%i\bin\java.exe" set "JAVA_DEFINITIVO=%%i"
)

:: 2. Procurar Java da Oracle
if not defined JAVA_DEFINITIVO (
    for /d %%i in ("%ProgramFiles%\Java\jdk*") do (
        if exist "%%i\bin\java.exe" set "JAVA_DEFINITIVO=%%i"
    )
)

:: 3. Procurar Microsoft OpenJDK
if not defined JAVA_DEFINITIVO (
    for /d %%i in ("%ProgramFiles%\Microsoft\jdk*") do (
        if exist "%%i\bin\java.exe" set "JAVA_DEFINITIVO=%%i"
    )
)

:: 4. Procurar em Arquivos de Programas (x86)
if not defined JAVA_DEFINITIVO (
    for /d %%i in ("%ProgramFiles(x86)%\Eclipse Adoptium\jdk*") do (
        if exist "%%i\bin\java.exe" set "JAVA_DEFINITIVO=%%i"
    )
)

if not defined JAVA_DEFINITIVO (
    color 0C
    echo.
    echo ===============================================================================
    echo      ATENCAO: O INSTALADOR DO JAVA AINDA PRECISA SER CONCLUIDO!
    echo ===============================================================================
    echo.
    echo Para que o APK possa ser gerado sem o erro do Android Studio, voce precisa
    echo concluir a instalacao do instalador oficial do Java (OpenJDK 17).
    echo.
    echo 1. Va na sua pasta Downloads do Windows.
    echo 2. De 2 cliques no arquivo: OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.msi
    echo 3. Avance ate o final (Next -^> Next -^> Install -^> Finish).
    echo.
    echo Se voce ainda nao baixou, vamos abrir o link direto para voce baixar agora:
    echo https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.msi
    echo.
    set /p "ABRIR_LINK=Deseja abrir o download do instalador agora? (S/N): "
    if /i "%ABRIR_LINK%"=="S" (
        start "" "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.msi"
    )
    echo.
    echo Depois de instalar, basta executar este arquivo de novo!
    pause
    exit /b 1
)

echo [OK!] Java saudavel e ativo em:
echo       "%JAVA_DEFINITIVO%"
echo.

:: ==============================================================================
:: PASSO 3: COMPILAR O APK COM O JAVA E O SDK CORRETOS
:: ==============================================================================
echo [3/3] Compilando seu APK agora mesmo... Aguarde carregar...
echo.

set "JAVA_HOME=%JAVA_DEFINITIVO%"
set "PATH=%JAVA_DEFINITIVO%\bin;%SystemRoot%\system32;%SystemRoot%"

:: Configurar SDK do Android
set "MY_SDK=%LocalAppData%\Android\Sdk"
if exist "%MY_SDK%\platform-tools" (
    set "ESCAPED_SDK=%MY_SDK:\=\\%"
    echo sdk.dir=%ESCAPED_SDK%> "%~dp0android\local.properties"
)

:: Sincronizar os arquivos web mais recentes para dentro do Android
cd /d "%~dp0"
call npx cap copy android >nul 2>&1

cd /d "%~dp0android"
call gradlew.bat assembleDebug
cd /d "%~dp0"

echo.
set "DESTINO=%~dp0SEU_APK_AQUI"

if exist "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" (
    if not exist "%DESTINO%" mkdir "%DESTINO%"
    copy /y "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" "%DESTINO%\OSNIR_TURISMO.apk" >nul 2>&1

    echo ===============================================================================
    echo               PARABENS! SEU ARQUIVO .APK FOI GERADO COM SUCESSO!
    echo ===============================================================================
    echo.
    echo O arquivo para instalar no CELULAR esta salvo nesta pasta:
    echo -------------------------------------------------------------------------------
    echo %DESTINO%\OSNIR_TURISMO.apk
    echo -------------------------------------------------------------------------------
    echo.
    echo Abrindo a pasta na sua tela com o arquivo pronto para enviar...
    start "" explorer "%DESTINO%"
) else (
    echo ===============================================================================
    echo         NAO FOI POSSIVEL GERAR O APK. VEJA O MOTIVO ACIMA.
    echo ===============================================================================
)

echo.
echo Pressione qualquer tecla para encerrar.
pause >nul
exit /b 0
