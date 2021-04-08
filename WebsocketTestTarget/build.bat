@echo off
set CWD=%~dp0
echo Building WebsocketTestTarget.exe
echo current working directory: %CWD%

rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir WebsocketTestTarget.py
rmdir /S /Q WebsocketTestTarget.build
rmdir /S /Q WebsocketTestTarget.dist
rmdir /S /Q WebsocketTestTarget.onefile-build
move WebsocketTestTarget.exe .\dist\

echo Finished building WebsocketTestTarget.exe