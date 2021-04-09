@echo off
set CWD=%~dp0
echo
echo Building AudioTrigger.exe
echo current working directory: %CWD%

echo Removing previous build
rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

CALL nexe index.js -t x64-14.15.3 -r "public" -r "node_modules" -r "../VERSION" -r "../BUILD"
move AudioTrigger.exe "%CWD%\dist\"

echo Finished building AudioTrigger.exe