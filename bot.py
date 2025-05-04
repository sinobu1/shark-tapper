from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram import F
import asyncio
import os

TOKEN = os.getenv("8019182445:AAE9gXSMIcYAp5pR0CichpWOTrRC24p4lBI")

bot = Bot(token=TOKEN)
dp = Dispatcher(storage=MemoryStorage())

@dp.message(F.text == "/start")
async def start_cmd(message: types.Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎮 Играть", url="https://t.me/tralalerocombat_bot?profile")]
        ]
    )
    await message.answer("Добро пожаловать! Нажми кнопку, чтобы начать игру:", reply_markup=keyboard)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
