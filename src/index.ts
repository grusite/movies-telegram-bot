import TelegramBot from "node-telegram-bot-api"
import { readAndSendMessage } from "./utilities/telegramBot"

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true })

bot.on('message', async (msg) => readAndSendMessage(bot, msg))

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
  process.exit(1);
})

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled Rejection:', (reason as Error).message);
})