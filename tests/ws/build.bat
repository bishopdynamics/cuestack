rmdir /S /Q dist
mkdir dist

py -m nuitka --mingw64 --onefile --plugin-enable=pylint-warnings --windows-onefile-tempdir WSTest.py
rmdir /S /Q WSTest.build
rmdir /S /Q WSTest.dist
rmdir /S /Q WSTest.onefile-build
move WSTest.exe .\dist\