#!/bin/bash
# DARK ZONE 黑域：诡城 — 本地启动器（双击运行，无需联网）
cd "$(dirname "$0")"
PORT=8123
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server $PORT >/dev/null 2>&1 &
else
  python3 -m http.server $PORT >/dev/null 2>&1 &
fi
SERVER_PID=$!
sleep 1
open "http://localhost:$PORT/index.html"
echo "DARK ZONE running at http://localhost:$PORT/index.html"
wait $SERVER_PID
