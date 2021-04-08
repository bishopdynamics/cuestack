rmdir /S /Q venv
py -m virtualenv venv || echo "possibly missing virtualenv package"
call .\venv\Scripts\activate
py -m pip install -r requirements.txt & deactivate && echo "setup complete"
