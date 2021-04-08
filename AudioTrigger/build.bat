@echo off
set CWD=%~dp0
echo Building AudioTrigger.exe
echo current working directory: %CWD%

rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

npm install -g nexe
npm install
nexe index.js -t x64-14.15.3 -r "public" -r "node_modules"

move AudioTrigger.exe .\dist\

echo Finished building AudioTrigger.exe