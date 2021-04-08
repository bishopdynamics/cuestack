
@echo off
set CWD_TOP=%~dp0
echo Building all binaries for Windows"
echo current working directory: %CWD_TOP%

rmdir /S /Q "%CWD_TOP%\dist"
mkdir "%CWD_TOP%\dist"

cd "%CWD_TOP%\CueStackClient"
CALL build
move "%CWD_TOP%\CueStackClient\dist\CueStackClient.exe" "%CWD_TOP%\dist\"
rmdir /S /Q "%CWD_TOP%\CueStackClient\dist"
cd "%CWD_TOP%"

cd "%CWD_TOP%\CueStack"
CALL build
move "%CWD_TOP%\CueStack\dist\CueStack.exe" "%CWD_TOP%\dist\"
move "%CWD_TOP%\CueStack\dist\VoicemeeterAgent.exe" "%CWD_TOP%\dist\"
rmdir /S /Q "%CWD_TOP%\CueStack\dist"
cd "%CWD_TOP%"

cd "%CWD_TOP%\AudioTrigger"
CALL build
move "%CWD_TOP%\AudioTrigger\dist\AudioTrigger.exe" "%CWD_TOP%\dist\"
rmdir /S /Q "%CWD_TOP%\AudioTrigger\dist"
cd "%CWD_TOP%"

cd "%CWD_TOP%\WebsocketTestTarget"
CALL build
move "%CWD_TOP%\WebsocketTestTarget\dist\WebsocketTestTarget.exe" "%CWD_TOP%\dist\"
rmdir /S /Q "%CWD_TOP%\WebsocketTestTarget\dist"
cd "%CWD_TOP%"

echo "done"