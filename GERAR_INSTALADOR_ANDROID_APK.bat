@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title OSNIR TURISMO - Gerador de Aplicativo Android (.APK)
color 0A
cls

echo ===============================================================================
echo            OSNIR TURISMO - GERADOR DE APLICATIVO CELULAR (.APK)
echo ===============================================================================
echo.
echo Abrindo o gerador visual oficial no seu navegador...
echo.

if exist "%~dp0GERAR_APK_PELO_NAVEGADOR.html" (
    start "" "%~dp0GERAR_APK_PELO_NAVEGADOR.html"
) else (
    start https://www.pwabuilder.com/?url=https://ais-pre-lpn7dwmjldtbsjj77z7w6i-274899359807.us-east1.run.app
)

echo [OK] O gerador visual com botoes foi aberto no seu navegador de internet!
echo.
echo Como gerar seu arquivo .apk na tela que abriu:
echo 1. Clique no botao azul "👉 CLIQUE AQUI PARA BAIXAR O .APK NO NAVEGADOR"
echo 2. Na pagina da Microsoft, clique em "Package for stores"
echo 3. Em "Android", clique em "Generate Package" e baixe o .apk!
echo.
echo ===============================================================================
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
exit /b 0
