@echo off
setlocal enabledelayedexpansion
title INSTALADOR DO JAVA 17 - OSNIR TURISMO
color 0B
cls

echo ===============================================================================
echo             INSTALADOR AUTOMATICO DO JAVA 17 (LTS) - OSNIR TURISMO
echo ===============================================================================
echo.
echo Este utilitario baixa e instala a versao exata do Java 17 exigida pelo Android.
echo Isso resolve de vez o erro "Unsupported class file major version".
echo.
echo Pressione qualquer tecla para iniciar o download e instalacao...
pause >nul
echo.

set "INST_URL=https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.msi"
set "MSI_FILE=%TEMP%\OpenJDK17_Installer.msi"

echo 1. Baixando o Eclipse Adoptium Java 17 LTS oficial...
echo    Aguarde cerca de 30 a 60 segundos...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%INST_URL%', '%MSI_FILE%')"

if not exist "%MSI_FILE%" (
    color 0C
    echo [ERRO] Nao foi possivel baixar o instalador automaticamente.
    echo Por favor, acesse este link no seu navegador para baixar o Java 17:
    echo https://adoptium.net/temurin/releases/?version=17
    pause
    exit /b 1
)

echo.
echo 2. Instalando o Java 17 no sistema...
echo    Uma janela de instalacao do Java 17 vai abrir. Se o Windows pedir permissao de Administrador, clique em SIM!
msiexec /i "%MSI_FILE%" /passive /norestart ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome

echo [OK] Instalacao do Java 17 concluida com sucesso!
echo.
echo ===============================================================================
echo   TUDO PRONTO! Agora voce pode rodar o GERAR_APK_CELULAR.bat normalmente!
echo ===============================================================================
echo.
pause
exit /b 0
