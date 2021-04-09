@echo off
set CWD=%~dp0
echo.
echo Building CueStack.exe and VoicemeeterAgent.exe
echo current working directory: %CWD%

echo Removing previous build
rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

echo.
echo Building CueStack.exe
py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --plugin-enable=multiprocessing --windows-onefile-tempdir --include-data-file=../VERSION=VERSION --include-data-file=../BUILD=BUILD CueStack.py
move Cuestack.exe "%CWD%\dist\"
rmdir /S /Q CueStack.build
rmdir /S /Q CueStack.dist
rmdir /S /Q CueStack.onefile-build
echo Finished building Cuestack.exe

echo.
echo Building VoicemeeterAgent.exe
py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir --include-data-file=../VERSION=VERSION --include-data-file=../BUILD=BUILD VoicemeeterAgent.py
move VoicemeeterAgent.exe "%CWD%\dist\"
rmdir /S /Q VoicemeeterAgent.build
rmdir /S /Q VoicemeeterAgent.dist
rmdir /S /Q VoicemeeterAgent.onefile-build
echo Finished building VoicemeeterAgent.exe
