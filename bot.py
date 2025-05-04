import logging
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

API_TOKEN = '8019182445:AAE9gXSMIcYAp5pR0CichpWOTrRC24p4lBI'

# Ссылка на игру
game_url = "https://t.me/tralalerocombat_bot?profile"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создаем объект бота
bot = Bot(token=API_TOKEN)

# Создаем Dispatcher для бота
dp = Dispatcher()

# Кнопка "Играть" (открывает игру по ссылке)
play_markup = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="🎮 Играть", url=game_url)]  # Используем url вместо callback_data
])

# Команда /start
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "Привет! Нажми кнопку, чтобы начать игру:",
        reply_markup=play_markup
    )

# Запуск бота
async def main():
    # Регистрация маршрутов
    await dp.start_polling(bot)

if __name__ == '__main__':
    # Запуск бота
    asyncio.run(main())
