import logging
import json
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext
import config

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

# Команда /start: отправляет кнопку Web App
def start(update: Update, context: CallbackContext):
    keyboard = [
        [InlineKeyboardButton("Играть!", web_app=WebAppInfo(url=config.WEB_APP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    update.message.reply_text(
        "Привет! Добро пожаловать в игру 2048pro. Нажми кнопку ниже, чтобы начать играть!",
        reply_markup=reply_markup
    )

# Обработка данных из Web App
def handle_web_app_data(update: Update, context: CallbackContext):
    data = json.loads(update.message.web_app_data.data)
    score = data.get('score')
    nickname = data.get('nickname', 'игрок')
    context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=f"Игрок {nickname} набрал {score} очков!"
    )

# Команда /help
def help_command(update: Update, context: CallbackContext):
    update.message.reply_text(
        "Используйте /start для начала игры. Играй и делись результатами!"
    )

# Точка входа в бота
def main():
    updater = Updater(config.TELEGRAM_TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("help", help_command))
    dp.add_handler(
        MessageHandler(Filters.status_update.web_app_data, handle_web_app_data)
    )

    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()