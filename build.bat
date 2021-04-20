
@echo off
set CWD_TOP=%~dp0
echo Building all binaries for Windows
echo current working directory: %CWD_TOP%

set FINAL_DIST=%CWD_TOP%\dist\latest

git rev-parse --short HEAD > BUILD
set /p CUR_COMMIT=<BUILD
set /p CUR_VERSION=<VERSION
echo Creating build %CUR_VERSION%-%CUR_COMMIT% at %FINAL_DIST%


echo Removing previous build
rmdir /S /Q "%FINAL_DIST%"
mkdir "%FINAL_DIST%"

cd "%CWD_TOP%\CueStackClient"
CALL build
move "%CWD_TOP%\CueStackClient\dist\CueStackClient.exe" "%FINAL_DIST%\"
rmdir /S /Q "%CWD_TOP%\CueStackClient\dist"
cd "%CWD_TOP%"

cd "%CWD_TOP%\CueStack"
CALL build
move "%CWD_TOP%\CueStack\dist\CueStack.exe" "%FINAL_DIST%\"
move "%CWD_TOP%\CueStack\dist\VoicemeeterAgent.exe" "%FINAL_DIST%\"
move "%CWD_TOP%\CueStack\dist\ATEMAgent.exe" "%FINAL_DIST%\"
rmdir /S /Q "%CWD_TOP%\CueStack\dist"
cd "%CWD_TOP%"

cd "%CWD_TOP%\AudioTrigger"
CALL build
move "%CWD_TOP%\AudioTrigger\dist\AudioTrigger.exe" "%FINAL_DIST%\"
rmdir /S /Q "%CWD_TOP%\AudioTrigger\dist"
cd "%CWD_TOP%"

cd "%CWD_TOP%\WebsocketTestTarget"
CALL build
move "%CWD_TOP%\WebsocketTestTarget\dist\WebsocketTestTarget.exe" "%FINAL_DIST%\"
rmdir /S /Q "%CWD_TOP%\WebsocketTestTarget\dist"
cd "%CWD_TOP%"

echo.
echo Finished building all binaries for Windows