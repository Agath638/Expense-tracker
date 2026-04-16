import sys
from pathlib import Path
from subprocess import run

project_root = Path(__file__).resolve().parent
venv_python = project_root / '.venv' / 'Scripts' / 'python.exe'

# If Flask is not available in the current interpreter, retry with the local venv.
try:
    from app import create_app
except ModuleNotFoundError as error:
    if str(error).startswith("No module named 'flask'") and venv_python.exists():
        print('Flask is not installed in the current Python interpreter.')
        print('Re-launching app with the local virtual environment...')
        run([str(venv_python), str(project_root / 'run.py')] + sys.argv[1:])
        sys.exit(0)
    raise

# This is the application entry point.
# Run the app with: python run.py

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
