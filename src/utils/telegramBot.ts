import TelegramBot from "node-telegram-bot-api";
import { getIMDBInfoById, getIMDBInfoByTitleAndYear } from './IMDB.js'
import { getTMDBInfoById, getTMDBInfoByTitleAndYear} from './TMDB.js'
import { formatRatingNumber, extractMediaInfoFromOverseerBot, extractMediaInfoFromOverseerWebhook } from './index.js'
import { logger } from "./logger.js";
import type { OverseerrPayload } from "../types/overseerr"
import type { TautulliNotificationPayload } from '../types/tautulli'

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true })
// bot.on('message', async (msg) => readAndSendMessage(msg))

/**
 * Reads a message and sends a formatted response in a Telegram chat.
 * 
 * This function processes a message received from Telegram, extracts media information,
 * fetches additional data from IMDb and TMDb, and sends a detailed response back to the chat.
 * It formats the response with movie/series details, ratings, and relevant links.
 * 
 * @param {TelegramBot.Message} msg - The message received from Telegram.
 * @throws Will throw an error if processing or fetching additional information fails.
 */
export async function readAndSendMessage(msg: TelegramBot.Message) {
  logger.overseerrMedia('Original message: ', msg)

  if (!msg.text || typeof msg.text !== 'string') {
    logger.overseerrMedia('Invalid message: ', msg)
    return
  }

  const mediaInfo = extractMediaInfoFromOverseerBot(msg.text)
  logger.overseerrMedia('Extracted movie info: ', mediaInfo)
  if (mediaInfo) {
    try {
      // Fetch IMDb and TMDb data for the movie
      const imdbInfo = await getIMDBInfoByTitleAndYear(mediaInfo.title, mediaInfo.year)
      const tmdbInfo = await getTMDBInfoByTitleAndYear(
        mediaInfo.title,
        mediaInfo.year,
        mediaInfo.type === 'Movie'
      )

      if (tmdbInfo) {
        /* Movie info (title+desc) */
        let caption = `<strong>Nueva ${tmdbInfo.type} - ${tmdbInfo.title?.translated} (${mediaInfo.year})</strong>\n`
        caption += `<strong>(${imdbInfo?.type || tmdbInfo.type} - ${tmdbInfo.title?.original} (${
          mediaInfo.year
        }))</strong>\n`
        caption += `<strong>[${tmdbInfo.genres.join(', ')}]</strong>\n`
        caption += `\n`
        caption += `<strong>${tmdbInfo.title?.tagline}</strong>\n`
        caption += `${
          tmdbInfo.plot.length > 600 ? tmdbInfo.plot.slice(0, 600) + '...' : tmdbInfo.plot
        }\n`
        caption += `\n`

        /* Requested info */
        caption += `<strong>Pedido por: </strong>${mediaInfo.requestedBy}\n`
        caption += `<strong>Estado: </strong> ${
          mediaInfo.requestStatus === 'Available' ? 'Disponible' : mediaInfo.requestStatus
        }\n`
        if (tmdbInfo.type === 'Serie') {
          caption += `<strong>Temporada/s descargada/s: </strong>${mediaInfo.requestedSeasons}\n`
          caption += `<strong>Número de episodios: </strong>${tmdbInfo.numberOfEpisodes}\n`
          caption += `<strong>Número de temporadas: </strong>${tmdbInfo.numberOfSeasons}\n`
        }
        caption += `\n`

        /* Ratings */
        caption += `<strong>Rating:</strong>\n`
        if (imdbInfo)
          caption += `    - <strong>IMDB</strong>: <strong>${
            imdbInfo?.rating?.total ?? 0
          }/10</strong> <em>(${formatRatingNumber(imdbInfo?.rating?.numVotes) ?? 0} votos)</em>\n`
        caption += `    - <strong>TMDB</strong>: <strong>${
          tmdbInfo.rating?.total ?? 0
        }/10</strong> <em>(${formatRatingNumber(tmdbInfo.rating?.numVotes) ?? 0} votos)</em>\n`
        caption += `\n`

        /* Important links */
        caption += `<a href="${
          msg.entities?.[3]?.url || msg.entities?.[4]?.url
        }">Ver media en Overseer</a>\n`
        if (imdbInfo)
          caption += `<a href="https://www.imdb.com/title/${imdbInfo?.id}">Ver media en IMDB</a>\n`
        caption += `<a href="https://www.themoviedb.org/${
          mediaInfo.type === 'Movie' ? 'movie' : 'tv'
        }/${tmdbInfo.id}">Ver media en TMDB</a>\n`

        // Send the photo with the caption to the chat
        bot
          .sendPhoto(msg.chat.id, tmdbInfo.coverImageUrl, {
            caption,
            parse_mode: 'HTML',
          })
          .then(() => {
            // Then delete the original message
            bot.deleteMessage(msg.chat.id, msg.message_id)
          })
          .catch((error) => {
            logger.error(error.message)
          })
      }
    } catch (err) {
      const error = err as Error;
      bot.sendMessage(msg.chat.id, `Error fetching rating for ${mediaInfo.title}`)
      logger.error(error.message)
    }
  }
}

/**
 * Sends a message to a specified Telegram chat based on Overseerr webhook data.
 * 
 * This function processes Overseerr webhook payload, fetches additional information
 * from TMDB and IMDB, and sends a formatted message to the specified Telegram chat.
 * 
 * @param {string} chatId - The Telegram chat ID where the message will be sent.
 * @param {OverseerrPayload} overseerrPayload - The payload received from Overseerr webhook.
 * @throws Will throw an error if processing the information fails.
 */
export async function sendMessageFromOverseerrWebhook(chatId: string, overseerrPayload: OverseerrPayload) {
  const { notification_type, event, subject, message, image, media, request, extra } = overseerrPayload;

  const isMovie = media?.media_type === 'movie';
  const mediaInfo = extractMediaInfoFromOverseerWebhook(subject)
  logger.overseerrMedia('Extracted media info: ', mediaInfo)

  try {
    if(!media || (!mediaInfo && !isMovie)) throw new Error(`No media info found for: ${subject}`)

    // Fetch IMDb and TMDb data for the movie
    const tmdbInfo = await getTMDBInfoById(+media.tmdbId, isMovie);
    const imdbInfo = isMovie ? await getIMDBInfoById(tmdbInfo.imdbId) : await getIMDBInfoByTitleAndYear(mediaInfo!.title, mediaInfo!.year);
    logger.overseerrMedia("imdbInfo: ", imdbInfo)

    if (tmdbInfo) {
      /* Movie info (title+desc) */
      let caption = `<strong>Nueva ${tmdbInfo.type} - ${tmdbInfo.title?.translated} (${mediaInfo!.year})</strong>\n`
      caption += `<strong>New ${imdbInfo?.type || tmdbInfo.type} - ${tmdbInfo.title?.original} (${
        mediaInfo!.year
      })</strong>\n`
      caption += `<strong>Géneros:</strong> ${tmdbInfo.genres.join(', ')}\n`
      caption += `\n`
      caption += `<strong>${tmdbInfo.title?.tagline}</strong>\n`
      caption += `${
        tmdbInfo.plot.length > 600 ? tmdbInfo.plot.slice(0, 600) + '...' : tmdbInfo.plot
      }\n`
      caption += `\n`

      /* Requested info */
      if(request) {
        caption += `<strong>Pedido por: </strong><a href="${request.requestedBy_avatar}">${request.requestedBy_username}</a>\n`
      }
      caption += `<strong>Estado:</strong> ${
        notification_type === 'MEDIA_AVAILABLE' ? 'Disponible' : notification_type
      }\n`
      if (
        !isMovie &&
        tmdbInfo.numberOfEpisodes &&
        tmdbInfo.numberOfSeasons &&
        extra[0].name === 'Requested Seasons'
      ) {
        caption += `<strong>Temporada/s descargada/s: </strong>${+extra[0].value!}\n`
        caption += `<strong>Número de episodios: </strong>${tmdbInfo.numberOfEpisodes}\n`
        caption += `<strong>Número de temporadas: </strong>${tmdbInfo.numberOfSeasons}\n`
      }
      caption += `\n`

      /* Ratings */
      caption += `<strong>Rating:</strong>\n`
      if (imdbInfo && imdbInfo.rating?.total && imdbInfo.rating?.numVotes) {
        caption += `    - <strong>IMDB</strong>: <strong>${
          imdbInfo.rating.total
        }/10</strong> <em>(${formatRatingNumber(imdbInfo.rating.numVotes)} votos)</em>\n`
      }
      caption += `    - <strong>TMDB</strong>: <strong>${
        tmdbInfo.rating?.total ?? 0
      }/10</strong> <em>(${formatRatingNumber(tmdbInfo.rating?.numVotes) ?? 0} votos)</em>\n`
      caption += `\n`

      /* Important links */
      if (imdbInfo && imdbInfo.id) {
        caption += `<a href="https://www.imdb.com/title/${imdbInfo.id}">Ver media en IMDB</a>\n`
      }
      caption += `<a href="https://www.themoviedb.org/${media.media_type}/${media.tmdbId}">Ver media en TMDB</a>\n`

      // Send the photo with the caption to the chat
      bot
        .sendPhoto(chatId, tmdbInfo.coverImageUrl, {
          caption,
          parse_mode: 'HTML',
        })
        .catch((error) => {
          logger.error(error.message)
        })
    }
  } catch (err) {
    const error = err as Error;
    bot.sendMessage(chatId, `Ups! Siento deciros que ha habido un error al intentar procesar la información de: ${subject}`);
    logger.error(error.message);
    throw error.message;
  }
}

export async function sendTranscodingMessageFromTautulliWebhook(chatId: string, tautulliPayload: TautulliNotificationPayload) {}

export async function sendEndOfEpisodeMessageFromTautulliWebhook(chatId: string, tautulliPayload: TautulliNotificationPayload) {}