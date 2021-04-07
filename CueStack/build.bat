rmdir /S /Q dist
mkdir dist

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir VoicemeeterAgent.py
rmdir /S /Q VoicemeeterAgent.build
rmdir /S /Q VoicemeeterAgent.dist
rmdir /S /Q VoicemeeterAgent.onefile-build
move VoicemeeterAgent.exe .\dist\

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings=multiprocessing --windows-onefile-tempdir CueStack.py
rmdir /S /Q CueStack.build
rmdir /S /Q CueStack.dist
rmdir /S /Q CueStack.onefile-build
move Cuestack.exe .\dist\
