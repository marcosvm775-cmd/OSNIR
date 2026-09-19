@echo off
title OSNIR TURISMO - Gerador de Instalador Windows Facil (.exe)
color 0B
cls

echo ===============================================================================
echo                OSNIR TURISMO - GERADOR DE INSTALADOR (.EXE)
echo                    Metodo Direto (Sem compilador Rust/C++)
echo ===============================================================================
echo.
echo Este gerador cria o instalador .exe tradicional do Windows usando apenas Node.js.
echo.

echo [1/3] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Baixe e instale a versao recomendada (LTS) em: https://nodejs.org/
    echo Apos instalar, reinicie o computador.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js detectado!

echo.
echo [2/3] Instalando os pacotes e o gerador de executavel...
echo (Aguarde alguns instantes enquanto os arquivos sao preparados...)
call npm install electron electron-builder --save-dev

echo.
echo [3/3] Compilando a interface e fabricando o Instalador .exe...
call npx electron-builder --win nsis

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo                     PARABENS! INSTALADOR GERADO COM SUCESSO!
    echo ===============================================================================
    echo.
    echo O seu instalador .exe pronto para enviar/vender aos clientes foi criado em:
    echo.
    echo     Pasta: dist-electron\
    echo     Arquivo: OSNIR TURISMO Setup 2.5.0.exe
    echo.
    echo Caracteristicas do instalador:
    echo  - Instalador padrao Windows em Portugues (Next, Next, Finish)
    echo  - Icone oficial do sistema na Area de Trabalho e Menu Iniciar
    echo  - Cria o banco de dados automaticamente na 1a execucao
    echo  - Sistema de ativacao de 1 chave para ate 3 computadores
    echo ===============================================================================
    echo.
    echo Abrindo a pasta do instalador para voce...
    explorer dist-electron
) else (
    echo.
    echo [ERRO] Ocorreu uma falha durante a geracao. Veja as mensagens acima.
)

pause
