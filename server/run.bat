@echo off
REM Project Horizons — NeoForge 21.1.224 Server Launch Script
REM Uses portable JDK 21 from tools/java/
REM Add custom JVM arguments to user_jvm_args.txt

set JAVA_HOME=%~dp0..\tools\java\jdk-21.0.10+7
set PATH=%JAVA_HOME%\bin;%PATH%

echo [Horizons] Using Java: %JAVA_HOME%
java -version
echo.
echo [Horizons] Starting NeoForge 21.1.224 server...
java @user_jvm_args.txt @libraries/net/neoforged/neoforge/21.1.224/win_args.txt nogui %*
pause
