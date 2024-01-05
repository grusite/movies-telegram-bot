import express from 'express'
import { OverseerrPayload, sendMessageFromOverseerrWebhook } from './utils/telegramBot.js'

const app = express();
const port = process.env.PORT || 3000

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('OK')
})

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
})

app.post('/webhook', async (req, res) => {
  const body: OverseerrPayload = req.body
  console.log('Received webhook from Overseer: ', body);

  try{
    await sendMessageFromOverseerrWebhook(process.env.TELEGRAM_CHAT_ID!, body)

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId: process.env.TELEGRAM_CHAT_ID,
      title: body.subject,
      notificationType: body.notification_type,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId: process.env.TELEGRAM_CHAT_ID,
      title: body.subject,
      notificationType: body.notification_type,
      error,
    })
  }
});

app.post('/webhook/transcoding', async (req, res) => {
  const body = req.body
  console.log('Received webhook from Tautulli: ', body)

  res.status(200).send('OK')
})

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
