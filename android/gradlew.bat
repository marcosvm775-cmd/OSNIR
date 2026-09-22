@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%"=="" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem =========================================================================
@rem BUSCA INTELIGENTE DE JAVA (IGNORA O JBR CORROMPIDO DO ANDROID STUDIO)
@rem =========================================================================

@rem 1. Se JAVA_HOME estiver definido e for válido (testando se o java.exe realmente roda sem erro de jvm.cfg)
if defined JAVA_HOME (
    set "TEST_JAVA=%JAVA_HOME:"=%\bin\java.exe"
    if exist "%TEST_JAVA%" (
        "%TEST_JAVA%" -version >NUL 2>&1
        if %ERRORLEVEL% equ 0 (
            set "JAVA_EXE=%TEST_JAVA%"
            goto execute
        )
    )
)

@rem 2. Buscar Eclipse Adoptium / Temurin
for /d %%i in ("%ProgramFiles%\Eclipse Adoptium\jdk*") do (
    if exist "%%i\bin\java.exe" (
        "%%i\bin\java.exe" -version >NUL 2>&1
        if %ERRORLEVEL% equ 0 (
            set "JAVA_EXE=%%i\bin\java.exe"
            goto execute
        )
    )
)

@rem 3. Buscar Java Oracle
for /d %%i in ("%ProgramFiles%\Java\jdk*") do (
    if exist "%%i\bin\java.exe" (
        "%%i\bin\java.exe" -version >NUL 2>&1
        if %ERRORLEVEL% equ 0 (
            set "JAVA_EXE=%%i\bin\java.exe"
            goto execute
        )
    )
)

@rem 4. Buscar Microsoft OpenJDK
for /d %%i in ("%ProgramFiles%\Microsoft\jdk*") do (
    if exist "%%i\bin\java.exe" (
        "%%i\bin\java.exe" -version >NUL 2>&1
        if %ERRORLEVEL% equ 0 (
            set "JAVA_EXE=%%i\bin\java.exe"
            goto execute
        )
    )
)

@rem 5. Tentar java.exe do PATH geral somente se ele funcionar
set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo.
echo =========================================================================
echo ERRO: Nao foi possivel encontrar um Java valido no seu computador.
echo Por favor, instale o Java 17 (Eclipse Adoptium Temurin 17).
echo =========================================================================
echo.
goto fail

:execute
@rem Setup the command line
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
@rem End local scope for the variables with windows NT shell
if %ERRORLEVEL% equ 0 goto mainEnd

:fail
rem Always use exit /b so it does not close the caller's console window!
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
exit /b %EXIT_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
