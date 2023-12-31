import express from 'express'
import TelegramBot from 'node-telegram-bot-api'
import { readAndSendMessage } from './utilities/telegramBot.js'

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true })
// bot.on('message', async (msg) => readAndSendMessage(bot, msg))

const app = express();
const port = process.env.PORT || 3000

app.use(express.json());

app.post('/webhook', (req, res) => {
  const body = req.body;
  console.log('Received webhook from Overseer: ', body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`)
})

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled Rejection:', (reason as Error).message)
})
