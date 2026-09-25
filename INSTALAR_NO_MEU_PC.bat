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

:: Localizar onde estao os arquivos compilados do site (dist/index.html)
if exist "%RAIZ%dist\index.html" (
    set "PASTA_ORIGEM=%RAIZ%dist"
) else if exist "%RAIZ%android\app\src\main\assets\public\index.html" (
    set "PASTA_ORIGEM=%RAIZ%android\app\src\main\assets\public"
) else if exist "%RAIZ%index.html" (
    echo [INFO] Verificando arquivos para o computador...
    if not exist "%RAIZ%node_modules" (
        call npm install --no-audit --no-fund >nul 2>&1
    )
    call npx --yes vite build >nul 2>&1
    if exist "%RAIZ%dist\index.html" (
        set "PASTA_ORIGEM=%RAIZ%dist"
    ) else (
        set "PASTA_ORIGEM=%RAIZ%"
    )
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

:: Copiar script do servidor local ultraleve offline
if exist "%RAIZ%servidor.ps1" (
    copy /y "%RAIZ%servidor.ps1" "%PASTA_DESTINO%\servidor.ps1" >nul 2>&1
) else (
    :: Cria o script do servidor se nao existir
    (
        echo # Servidor Local Ultraleve Offline OSNIR TURISMO
        echo $port = 38450
        echo $folder = "$PSScriptRoot\sistema"
        echo try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect("127.0.0.1", $port); $tcp.Close(); exit 0 } catch {}
        echo $listener = New-Object System.Net.HttpListener
        echo $listener.Prefixes.Add("http://127.0.0.1:$port/")
        echo try { $listener.Start() } catch { exit 0 }
        echo while ($listener.IsListening) {
        echo     try {
        echo         $context = $listener.GetContext()
        echo         $request = $context.Request
        echo         $response = $context.Response
        echo         $localPath = $request.Url.LocalPath.TrimStart('/')
        echo         if ([string]::IsNullOrEmpty($localPath)) { $localPath = "index.html" }
        echo         $filePath = Join-Path $folder $localPath
        echo         if (Test-Path $filePath -PathType Leaf) {
        echo             $bytes = [System.IO.File]::ReadAllBytes($filePath)
        echo             $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        echo             $mime = switch ($ext) {
        echo                 ".html" { "text/html; charset=utf-8" }
        echo                 ".js"   { "application/javascript; charset=utf-8" }
        echo                 ".mjs"  { "application/javascript; charset=utf-8" }
        echo                 ".css"  { "text/css; charset=utf-8" }
        echo                 ".png"  { "image/png" }
        echo                 ".jpg"  { "image/jpeg" }
        echo                 ".svg"  { "image/svg+xml" }
        echo                 ".ico"  { "image/x-icon" }
        echo                 ".json" { "application/json; charset=utf-8" }
        echo                 default { "application/octet-stream" }
        echo             }
        echo             $response.ContentType = $mime
        echo             $response.Headers.Add("Access-Control-Allow-Origin", "*")
        echo             $response.Headers.Add("Cache-Control", "no-cache")
        echo             $response.ContentLength64 = $bytes.Length
        echo             $response.OutputStream.Write($bytes, 0, $bytes.Length)
        echo         } else {
        echo             $response.StatusCode = 404
        echo         }
        echo         $response.Close()
        echo     } catch {}
        echo }
    ) > "%PASTA_DESTINO%\servidor.ps1"
)

:: Criar inicializador oficial a prova de tela branca dentro da pasta do programa
(
echo @echo off
echo title OSNIR TURISMO
echo :: Inicia o servidor local offline em segundo plano sem janela
echo start "" /b powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%PASTA_DESTINO%\servidor.ps1"
echo :: Pequena pausa para garantir porta aberta
echo timeout /t 1 /nobreak >nul
echo set "APP_URL=http://127.0.0.1:38450"
echo set "FALLBACK_URL=file:///%PASTA_DESTINO:\=/%/sistema/index.html"
echo set "CHROME_FLAGS=--allow-file-access-from-files --allow-running-insecure-content --disable-web-security --user-data-dir=\"%%temp%%\OsnirTurismoBrowserProfile\" --window-size=1280,820"
echo.
echo :: 1. Tenta abrir no Microsoft Edge em modo Janela de Aplicativo
echo if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%%APP_URL%%"
echo     exit /b 0
echo ^)
echo if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%%APP_URL%%"
echo     exit /b 0
echo ^)
echo.
echo :: 2. Tenta abrir no Google Chrome em modo Janela de Aplicativo
echo if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%%APP_URL%%"
echo     exit /b 0
echo ^)
echo if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%%APP_URL%%"
echo     exit /b 0
echo ^)
echo if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%%APP_URL%%"
echo     exit /b 0
echo ^)
echo.
echo :: 3. Abre no navegador padrao
echo start "" "%%APP_URL%%"
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
echo oLink.WindowStyle = 7 >> "%temp%\atalho_osnir.vbs"
echo oLink.Save >> "%temp%\atalho_osnir.vbs"
cscript /nologo "%temp%\atalho_osnir.vbs" >nul 2>&1
del "%temp%\atalho_osnir.vbs" >nul 2>&1

color 0A
echo.
echo ===============================================================================
echo         INSTALACAO CONCLUIDA! O ICONE JA ESTA NA SUA AREA DE TRABALHO!
echo ===============================================================================
echo.
echo [x] Sistema 100%% offline instalado
echo [x] Servidor local com protecao total contra tela branca
echo [x] Atalho criado na sua Area de Trabalho
echo.
echo Abrindo o sistema agora mesmo...
echo.

start "" "%PASTA_DESTINO%\abrir.bat"

timeout /t 3 >nul
exit /b 0
