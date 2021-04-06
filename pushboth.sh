#!/usr/bin/env bash

# create a new commit if a message was provided
if [ -n "$1" ]; then
  git add .
  git commit -m "$1"
fi

git push origin main
git push local main
