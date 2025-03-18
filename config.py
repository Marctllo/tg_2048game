import os

class Config:
    TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")  # Токен бота
    WEBAPP_URL = "https://your-domain.com"        # URL Web App
    DATABASE_URI = "sqlite:///database.db"        # Путь к БД