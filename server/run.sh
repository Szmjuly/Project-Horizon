#!/usr/bin/env sh
# Project Horizons — NeoForge 21.1.224 Server Launch Script
# Uses portable JDK 21 from tools/java/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export JAVA_HOME="$SCRIPT_DIR/../tools/java/jdk-21.0.10+7"
export PATH="$JAVA_HOME/bin:$PATH"

echo "[Horizons] Using Java: $JAVA_HOME"
java -version
echo
echo "[Horizons] Starting NeoForge 21.1.224 server..."
java @user_jvm_args.txt @libraries/net/neoforged/neoforge/21.1.224/unix_args.txt nogui "$@"
