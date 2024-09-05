import express from 'express'
import {
  readAndSendAnnouncement, sendMessageFromOverseerrWebhook,
  sendTranscodingMessageFromTautulliWebhook,
  sendEndOfEpisodeMessageFromTautulliWebhook,
} from './telegramBot.js'
import { logger } from './utils/logger.js';
import { OverseerrPayload } from './types/overseerr';
import { TautulliTranscodingNotificationPayload, TautulliLastEpisodeNotificationPayload } from './types/tautulli'
import { consoleLogger } from './utils/consoleLogger.js';

const app = express();
const port = process.env.PORT || 3000

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('¡Ostras, pedrusco! ¡La máquina está viva! 🤖💃')
})

app.get('/health', (_req, res) => {
  res.status(200).send('¡Eso está más sano que una lechuga en un gimnasio! 🥬💪')
})

app.post('/send-announcement', async (req, res) => {
  const body: { text: string; server?: 'cerveperros' | 'skylate' } = req.body
  logger.info('/send-announcement')
  consoleLogger.announcement('Received announcement text to be sent', body)

  const chatIdByServer = {
    cerveperros: process.env.TELEGRAM_CVP_MEDIA_CHAT_ID!,
    skylate: process.env.TELEGRAM_SKYLATE_MEDIA_CHAT_ID!,
    default: process.env.TELEGRAM_TEST_MEDIA_CHAT_ID!,
  }
  const server: keyof typeof chatIdByServer = body.server ?? 'default'
  const chatId = chatIdByServer[server] || chatIdByServer['default']

  try {
    await readAndSendAnnouncement(chatId, body.text)

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId,
      text: body.text,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId,
      text: body.text,
      error,
    })
  }
})

app.post('/webhook/overseerr-media-notification', async (req, res) => {
  const body: OverseerrPayload = req.body
  logger.info('/webhook/overseerr-media-notification')
  consoleLogger.overseerrMedia('Received webhook from Overseer', body)

  const chatIdByServer = {
    cerveperros: process.env.TELEGRAM_CVP_MEDIA_CHAT_ID!,
    skylate: process.env.TELEGRAM_SKYLATE_MEDIA_CHAT_ID!,
    default: process.env.TELEGRAM_TEST_MEDIA_CHAT_ID!,
  }
  const server: keyof typeof chatIdByServer = body.server ?? 'default'
  const chatId = chatIdByServer[server] || chatIdByServer['default']

  try {
    sendMessageFromOverseerrWebhook(chatId, body)

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId,
      title: body.subject,
      notificationType: body.notification_type,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId,
      title: body.subject,
      notificationType: body.notification_type,
      error: (error as Error).message,
    })
  }
})

app.post('/webhook/tautulli-transcoding-notification', async (req, res) => {
  const body: TautulliTranscodingNotificationPayload = req.body
  logger.info('/webhook/tautulli-transcoding-notification')
  consoleLogger.tautulliTranscoding('Received webhook from Tautulli Transcoding Notification', body)

  const chatIdByServer = {
    cerveperros: process.env.TELEGRAM_CVP_TRANSCODING_CHAT_ID!,
    skylate: process.env.TELEGRAM_SKYLATE_TRANSCODING_CHAT_ID!,
    default: process.env.TELEGRAM_TEST_TRANSCODING_CHAT_ID!,
  }
  const server: keyof typeof chatIdByServer = body.server ?? 'default'
  const chatId = chatIdByServer[server] || chatIdByServer['default']

  try {
    await sendTranscodingMessageFromTautulliWebhook(
      chatId,
      body
    )

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId,
      title: body.title,
      user: body.user,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId,
      title: body.title,
      user: body.user,
      error: (error as Error).message,
    })
  }
});

app.post('/webhook/tautulli-last-episode-notification', async (req, res) => {
  const body: TautulliLastEpisodeNotificationPayload = req.body
  logger.info('/webhook/tautulli-last-episode-notification')
  consoleLogger.tuautlliLastEpisode(
    'Received webhook from Tautulli Last Episode Notification',
    body
  )

  const chatIdByServer = {
    cerveperros: process.env.TELEGRAM_CVP_LAST_EPISODE_CHAT_ID!,
    skylate: process.env.TELEGRAM_SKYLATE_LAST_EPISODE_CHAT_ID!,
    default: process.env.TELEGRAM_TEST_LAST_EPISODE_CHAT_ID!,
  }
  const server: keyof typeof chatIdByServer = body.server ?? 'default'
  const chatId = chatIdByServer[server] || chatIdByServer['default']

  try {
    await sendEndOfEpisodeMessageFromTautulliWebhook(
      chatId,
      body
    )

    return res.status(200).json({
      message: 'Telegram message successfully sent',
      chatId,
      title: body.title,
      user: body.user,
      error: null,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Telegram message not sent',
      chatId,
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
  logger.error(`There was an uncaught error \n\n ${err}`)
  logger.error('There was an uncaught error ', (err as Error).message)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  logger.error(`Unhandled Rejection: \n\n ${reason}`)
  logger.error('Unhandled Rejection: ', (reason as Error).message)
})
