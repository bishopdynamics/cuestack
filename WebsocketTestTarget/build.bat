@echo off
set CWD=%~dp0
echo
echo Building WebsocketTestTarget.exe
echo current working directory: %CWD%

echo Removing previous build
rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir --include-data-file=../VERSION=VERSION --include-data-file=../BUILD=BUILD WebsocketTestTarget.py
move WebsocketTestTarget.exe "%CWD%\dist\"
rmdir /S /Q WebsocketTestTarget.build
rmdir /S /Q WebsocketTestTarget.dist
rmdir /S /Q WebsocketTestTarget.onefile-build


echo Finished building WebsocketTestTarget.exe