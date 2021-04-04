rmdir /S /Q venv
py -m virtualenv venv || echo "possibly missing virtualenv package"
call .\venv\Scripts\activate
py -m pip install -r requirements.txt & py -m pip install pywin32 & deactivate && echo "setup complete"
