rmdir /S /Q venv
py -m pip install virtualenv
py -m virtualenv venv
call .\venv\Scripts\activate
py -m pip install -r requirements.txt & py -m pip install pywin32 & deactivate && echo "setup complete"
