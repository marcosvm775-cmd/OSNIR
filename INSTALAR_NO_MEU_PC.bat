@echo off
setlocal enabledelayedexpansion
title INSTALADOR OFICIAL DO PC - OSNIR TURISMO
color 0B
cls

echo ===============================================================================
echo        INSTALADOR OFICIAL PARA COMPUTADOR (PC) - OSNIR TURISMO
echo ===============================================================================
echo.
echo Instalando o sistema no seu computador...
echo.

set "RAIZ=%~dp0"
set "PASTA_ORIGEM="

:: Localizar onde estao os arquivos do site (index.html)
if exist "%RAIZ%dist\index.html" (
    set "PASTA_ORIGEM=%RAIZ%dist"
) else if exist "%RAIZ%android\app\src\main\assets\public\index.html" (
    set "PASTA_ORIGEM=%RAIZ%android\app\src\main\assets\public"
) else if exist "%RAIZ%index.html" (
    set "PASTA_ORIGEM=%RAIZ%"
)

if not defined PASTA_ORIGEM (
    color 0C
    echo [ERRO] Nao foi possivel localizar o arquivo index.html.
    echo Certifique-se de extrair todos os arquivos do projeto.
    pause
    exit /b 1
)

echo [OK] Arquivos encontrados com sucesso!
echo.

:: Pasta permanente no computador
set "PASTA_DESTINO=%LocalAppData%\Programs\OsnirTurismo"
if not exist "%PASTA_DESTINO%" mkdir "%PASTA_DESTINO%"
if not exist "%PASTA_DESTINO%\sistema" mkdir "%PASTA_DESTINO%\sistema"

echo Copiando o sistema para o seu computador...
xcopy /e /y /q "%PASTA_ORIGEM%\*" "%PASTA_DESTINO%\sistema\" >nul 2>&1

:: Copiar icone se existir
if exist "%RAIZ%public\icon.ico" copy /y "%RAIZ%public\icon.ico" "%PASTA_DESTINO%\" >nul 2>&1
if exist "%RAIZ%dist\icon.ico" copy /y "%RAIZ%dist\icon.ico" "%PASTA_DESTINO%\" >nul 2>&1

:: Criar inicializador dentro da pasta do programa
(
echo @echo off
echo title OSNIR TURISMO
echo set "SISTEMA_URL=file:///%PASTA_DESTINO:\=/%/sistema/index.html"
echo set "CHROME_FLAGS=--allow-file-access-from-files --allow-running-insecure-content --disable-web-security --user-data-dir=\"%%temp%%\OsnirTurismoBrowserProfile\" --window-size=1280,820"
echo if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%%SISTEMA_URL%%" %%CHROME_FLAGS%%
echo     exit /b 0
echo ^)
echo if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%%SISTEMA_URL%%" %%CHROME_FLAGS%%
echo     exit /b 0
echo ^)
echo if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%%SISTEMA_URL%%" %%CHROME_FLAGS%%
echo     exit /b 0
echo ^)
echo if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%%SISTEMA_URL%%" %%CHROME_FLAGS%%
echo     exit /b 0
echo ^)
echo if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%%SISTEMA_URL%%" %%CHROME_FLAGS%%
echo     exit /b 0
echo ^)
echo start "" "%PASTA_DESTINO%\sistema\index.html"
echo exit /b 0
) > "%PASTA_DESTINO%\abrir.bat"

:: Criar atalho na Área de Trabalho
echo Criando o icone oficial na sua Area de Trabalho...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\atalho_osnir.vbs"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\OSNIR TURISMO.lnk" >> "%temp%\atalho_osnir.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\atalho_osnir.vbs"
echo oLink.TargetPath = "%PASTA_DESTINO%\abrir.bat" >> "%temp%\atalho_osnir.vbs"
echo oLink.WorkingDirectory = "%PASTA_DESTINO%" >> "%temp%\atalho_osnir.vbs"
echo oLink.Description = "Sistema de Gestao OSNIR TURISMO" >> "%temp%\atalho_osnir.vbs"
if exist "%PASTA_DESTINO%\icon.ico" (
    echo oLink.IconLocation = "%PASTA_DESTINO%\icon.ico,0" >> "%temp%\atalho_osnir.vbs"
)
echo oLink.Save >> "%temp%\atalho_osnir.vbs"
cscript /nologo "%temp%\atalho_osnir.vbs" >nul 2>&1
del "%temp%\atalho_osnir.vbs" >nul 2>&1

color 0A
echo.
echo ===============================================================================
echo         INSTALACAO CONCLUIDA! O ICONE JA ESTA NA SUA AREA DE TRABALHO!
echo ===============================================================================
echo.
echo O sistema agora abre direto do seu computador, mesmo sem internet!
echo Abrindo o sistema agora...
echo.

start "" "%PASTA_DESTINO%\abrir.bat"

timeout /t 3 >nul
exit /b 0
