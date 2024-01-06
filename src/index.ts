import express from 'express'
import { OverseerrPayload, sendMessageFromOverseerrWebhook } from './utils/telegramBot.js'
import { logger } from './utils/logger.js';

const app = express();
const port = process.env.PORT || 3000

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('OK')
})

app.get('/health', (_req, res) => {
  res.status(200).send('Monstruooo! Que todo ha ido bien ❤️')
})

app.post('/webhook/overseerr-media-notification', async (req, res) => {
  const body: OverseerrPayload = req.body
  logger.overseerrMedia('Received webhook from Overseer: ', body)

  try {
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
})

app.post('/webhook/tautulli-transcoding-notification', async (req, res) => {
  const body = req.body
  logger.tautulliTranscoding('Received webhook from Tautulli Transcoding Notification: ', body)

  res.status(200).send('OK')
});

app.post('/webhook/tautulli-last-episode-notification', async (req, res) => {
  const body = req.body
  logger.tuautlliLastEpisode('Received webhook from Tautulli Last Episode Notification: ', body)

  res.status(200).send('OK')
})

app.listen(port, () => {
  logger.info(`Server is running on ${port}`)
})

process.on('uncaughtException', (err) => {
  logger.error('There was an uncaught error', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection:', (reason as Error).message)
})
