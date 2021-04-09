@echo off
set CWD=%~dp0
echo.
echo Building CueStackClient.exe
echo current working directory: %CWD%

echo Removing previous build
rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir --include-data-file=../VERSION=VERSION --include-data-file=../BUILD=BUILD --include-data-file=javascript.js=javascript.js --include-data-file=index.html=index.html CueStackClient.py
move CueStackClient.exe "%CWD%\dist\"
rmdir /S /Q CueStackClient.build
rmdir /S /Q CueStackClient.dist
rmdir /S /Q CueStackClient.onefile-build

echo Finished building CueStackClient.exe
