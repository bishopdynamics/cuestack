#!/usr/bin/env bash

function bail {
  echo "something went wrong, bailing"
  exit 1
}

source venv/bin/activate || bail

python ViscaAgent.py $@ || bail

echo "exited cleanly"
