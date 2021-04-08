rmdir /S /Q dist
mkdir dist

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir --include-data-file=javascript.js=javascript.js --include-data-file=index.html=index.html CueStackClient.py
rmdir /S /Q CueStackClient.build
rmdir /S /Q CueStackClient.dist
rmdir /S /Q CueStackClient.onefile-build
move CueStackClient.exe .\dist\