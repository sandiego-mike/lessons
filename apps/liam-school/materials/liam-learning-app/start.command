#!/bin/bash
cd "$(dirname "$0")"
PORT=8080
python3 -m http.server "$PORT" >/tmp/liam-learning-app.log 2>&1 &
PID=$!
sleep 1
open "http://localhost:$PORT"
echo "Liam Learning is running at http://localhost:$PORT"
echo "Press Control-C to stop the local server."
wait $PID
