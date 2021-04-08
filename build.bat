
@echo off
set CWD=%~dp0
echo "current working directory: %CWD%"

rmdir /S /Q "%CWD%\dist"
mkdir "%CWD%\dist"

cd "%CWD%\CueStack"
build
move "%CWD%\CueStack\dist\*" %CWD%\dist\
rmdir /S /Q "%CWD%\CueStack\dist"
cd "%CWD%"

cd "%CWD%\CueStackClient"
build
move "%CWD%\CueStackClient\dist\CueStackClient.exe" "%CWD%\dist\"
rmdir /S /Q "%CWD%\CueStackClient\dist"
cd "%CWD%"

echo "done"