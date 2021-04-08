@echo off
set CWD=%~dp0
echo Building AudioTrigger.exe
echo current working directory: %CWD%

rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"


::CALL npm install -g nexe
::CALL npm install
cd "%CWD%\src
CALL nexe index.js -t x64-14.15.3 -r "public" -r "../node_modules"

move AudioTrigger.exe "%CWD%\dist\"

echo Finished building AudioTrigger.exe