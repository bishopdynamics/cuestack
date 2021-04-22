@echo off
set CWD=%~dp0
echo.
echo Building CueStackClient.exe
echo current working directory: %CWD%

echo Removing previous build
rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

py -m nuitka --mingw64 --onefile^
 --plugin-enable=pylint-warnings^
 --windows-onefile-tempdir^
 --include-data-file=../VERSION=VERSION^
 --include-data-file=../BUILD=BUILD^
 --include-data-file=style.css=style.css^
 --include-data-file=api.js=api.js^
 --include-data-file=util.js=util.js^
 --include-data-file=gui.js=gui.js^
 --include-data-file=javascript.js=javascript.js^
 --include-data-file=templates.js=templates.js^
 --include-data-file=reconnecting-websocket.js=reconnecting-websocket.js^
 --include-data-file=jquery-3.3.1.slim.min.js=jquery-3.3.1.slim.min.js^
 --include-data-file=jquery.json-editor.min.js=jquery.json-editor.min.js^
 --include-data-file=index.html=index.html^
 CueStackClient.py
move CueStackClient.exe "%CWD%\dist\"
rmdir /S /Q CueStackClient.build
rmdir /S /Q CueStackClient.dist
rmdir /S /Q CueStackClient.onefile-build

echo Finished building CueStackClient.exe
