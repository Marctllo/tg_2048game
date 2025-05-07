import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env')

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
WEB_APP_URL = "http://localhost:5000"
