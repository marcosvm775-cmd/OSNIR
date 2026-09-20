@echo off
if not "%~1"=="__CONSOLE__" (
    start "" cmd /k ""%~f0" __CONSOLE__"
    exit /b
)

title OSNIR TURISMO - Teste e Diagnostico do Computador
color 0E
cls

echo ===============================================================================
echo            OSNIR TURISMO - TESTE E DIAGNOSTICO DO SISTEMA
echo ===============================================================================
echo.
echo Pasta do projeto: %~dp0
echo.

echo [1/3] Verificando se o Node.js esta instalado no Windows...
where node >nul 2>&1
if %errorlevel% equ 0 goto :node_encontrado

echo     [ATENCAO] O comando node nao foi detectado no PATH do Windows!
echo.
echo     Verificando pastas padrao de instalacao do Node.js...
if exist "%ProgramFiles%\nodejs\node.exe" echo     [OK] Node.js encontrado em: %ProgramFiles%\nodejs\node.exe & goto :testar_dist
if exist "%LocalAppData%\Programs\nodejs\node.exe" echo     [OK] Node.js encontrado em: %LocalAppData%\Programs\nodejs\node.exe & goto :testar_dist

echo     [NAO ENCONTRADO] O Node.js ainda NAO esta instalado neste computador!
echo.
echo     Para gerar o instalador executavel no seu computador:
echo     1. Acesse o site oficial: https://nodejs.org
echo     2. Baixe e instale a versao recomendada LTS.
echo     3. Apos instalar, feche e abra o arquivo novamente.
goto :testar_dist

:node_encontrado
for /f "tokens=*" %%i in ('node -v') do echo     [SUCESSO] Node.js detectado: %%i
where npm >nul 2>&1
if %errorlevel% equ 0 for /f "tokens=*" %%j in ('npm -v') do echo     [SUCESSO] NPM detectado: versao %%j

:testar_dist
echo.
echo [2/3] Verificando arquivos prontos da interface - pasta dist...
if exist "%~dp0dist\index.html" (
    echo     [SUCESSO] A pasta dist e o arquivo index.html ja estao 100%% compilados e prontos!
) else (
    echo     [AVISO] A pasta dist ainda nao foi gerada.
)

echo.
echo [3/3] Verificando arquivo de configuracao package.json...
if exist "%~dp0package.json" (
    echo     [SUCESSO] package.json encontrado com sucesso!
) else (
    echo     [ERRO] package.json nao encontrado nesta pasta!
)

echo.
echo ===============================================================================
echo                       DIAGNOSTICO CONCLUIDO
echo ===============================================================================
echo.
echo Esta janela NUNCA fecha sozinha - modo protegido ativo.
echo Quando terminar de ler, basta fechar a janela no X ou pressionar qualquer tecla.
echo.
pause
