import express from 'express'
import {
  readAndSendAnnouncement, sendMessageFromOverseerrWebhook,
  sendTranscodingMessageFromTautulliWebhook,
  sendEndOfEpisodeMessageFromTautulliWebhook,
} from './telegramBot.js'
import { logger } from './utils/logger.js';
import { OverseerrPayload } from './types/overseerr';
import { TautulliTranscodingNotificationPayload, TautulliLastEpisodeNotificationPayload } from './types/tautulli'

const app = express();
const port = process.env.PORT || 3000

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('OK')
})

app.get('/health', (_req, res) => {
  res.status(200).send('Monstruooo! Que todo ha ido bien ❤️')
})

app.post('/send-announcement', async (req, res) => {
  const body: { text: string } = req.body
  logger.info('/send-announcement', '📣 Received announcement text to be sent: ', body)

  try {
    await readAndSendAnnouncement(process.env.TELEGRAM_MEDIA_CHAT_ID!, body.text)

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId: process.env.TELEGRAM_MEDIA_CHAT_ID,
      text: body.text,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId: process.env.TELEGRAM_MEDIA_CHAT_ID,
      text: body.text,
      error,
    })
  }
})

app.post('/webhook/overseerr-media-notification', async (req, res) => {
  const body: OverseerrPayload = req.body
  logger.info('/webhook/overseerr-media-notification', '🎥 Received webhook from Overseer: ', body)

  try {
    await sendMessageFromOverseerrWebhook(process.env.TELEGRAM_MEDIA_CHAT_ID!, body)

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId: process.env.TELEGRAM_MEDIA_CHAT_ID,
      title: body.subject,
      notificationType: body.notification_type,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId: process.env.TELEGRAM_MEDIA_CHAT_ID,
      title: body.subject,
      notificationType: body.notification_type,
      error: (error as Error).message,
    })
  }
})

app.post('/webhook/tautulli-transcoding-notification', async (req, res) => {
  const body: TautulliTranscodingNotificationPayload = req.body
  logger.info(
    '/webhook/tautulli-transcoding-notification',
    '🔥 Received webhook from Tautulli Transcoding Notification: ',
    body
  )

  try {
    await sendTranscodingMessageFromTautulliWebhook(process.env.TELEGRAM_TRANSCODING_CHAT_ID!, body)

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId: process.env.TELEGRAM_TRANSCODING_CHAT_ID,
      title: body.title,
      user: body.user,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId: process.env.TELEGRAM_TRANSCODING_CHAT_ID,
      title: body.title,
      user: body.user,
      error: (error as Error).message,
    })
  }
});

app.post('/webhook/tautulli-last-episode-notification', async (req, res) => {
  const body: TautulliLastEpisodeNotificationPayload = req.body
  logger.info(
    '/webhook/tautulli-last-episode-notification',
    '📺 Received webhook from Tautulli Last Episode Notification: ',
    body
  )

  try {
    await sendEndOfEpisodeMessageFromTautulliWebhook(process.env.TELEGRAM_LAST_EPISODE_CHAT_ID!, body)

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId: process.env.TELEGRAM_LAST_EPISODE_CHAT_ID,
      title: body.title,
      user: body.user,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId: process.env.TELEGRAM_LAST_EPISODE_CHAT_ID,
      title: body.title,
      user: body.user,
      error: (error as Error).message,
    })
  }
})

app.listen(port, () => {
  logger.info('Server is running on %s', port)
})

process.on('uncaughtException', (err) => {
  logger.error('There was an uncaught error ', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection: ', (reason as Error).message)
})
