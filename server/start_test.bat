@echo off
cd /d "C:\Users\smarkowitz\Downloads\Project Horizons\server"
set JAVA_HOME=C:\Users\smarkowitz\Downloads\Project Horizons\tools\java\jdk-21.0.10+7
set PATH=%JAVA_HOME%\bin;%PATH%
echo [Horizons] Java version:
java -version
echo.
echo [Horizons] Starting NeoForge server...
java @user_jvm_args.txt @libraries\net\neoforged\neoforge\21.1.224\win_args.txt nogui > server_output.log 2>&1
echo [Horizons] Server exited with code %ERRORLEVEL%
