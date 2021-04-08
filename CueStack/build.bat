@echo off
set CWD=%~dp0

echo Building CueStack.exe
echo current working directory: %CWD%

rmdir /S /Q dist
mkdir dist

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --plugin-enable=multiprocessing --windows-onefile-tempdir CueStack.py
rmdir /S /Q CueStack.build
rmdir /S /Q CueStack.dist
rmdir /S /Q CueStack.onefile-build
move Cuestack.exe .\dist\
echo Finished building Cuestack.exe

echo Building VoicemeeterAgent.exe
py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir VoicemeeterAgent.py
rmdir /S /Q VoicemeeterAgent.build
rmdir /S /Q VoicemeeterAgent.dist
rmdir /S /Q VoicemeeterAgent.onefile-build
move VoicemeeterAgent.exe .\dist\
echo Finished building VoicemeeterAgent.exe
