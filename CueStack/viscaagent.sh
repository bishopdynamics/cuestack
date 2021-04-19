#!/usr/bin/env bash

FOLDER="/home/pi/cuestack/CueStack"
LOG_FILE="/home/pi/viscaagent.log"

TIMESTAMP=$(date)
echo "$TIMESTAMP" > "$LOG_FILE"

cd "$FOLDER" || {
  echo "Failed to cd to $FOLDER" | tee -a "$LOG_FILE"
  exit 1
}

./run-viscaagent.sh >> "$LOG_FILE" 2>&1 || {
  echo "some kind of error while running run-viscaagent.sh" | tee -a "$LOG_FILE"
  exit 1
}
TIMESTAMP=$(date)
echo "$TIMESTAMP /run-viscaagent.sh exited cleanly" >> "$LOG_FILE"