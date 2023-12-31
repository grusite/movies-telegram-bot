import TelegramBot from "node-telegram-bot-api";
import { getIMDBInfoById, getIMDBInfoByTitleAndYear } from './IMDB.js'
import { getTMDBInfoById, getTMDBInfoByTitleAndYear} from './TMDB.js'
import { formatRatingNumber, extractMediaInfoFromOverseerBot, extractMediaInfoFromOverseerWebhook } from './index.js'

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true })
// bot.on('message', async (msg) => readAndSendMessage(msg))

export async function readAndSendMessage(msg: TelegramBot.Message) {
  console.log('Original message: ', msg)

  if (!msg.text || typeof msg.text !== 'string') {
    console.log('Invalid message: ', msg)
    return
  }

  const mediaInfo = extractMediaInfoFromOverseerBot(msg.text)
  console.log('Extracted movie info: ', mediaInfo)
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
            console.error(error.message)
          })
      }
    } catch (error) {
      bot.sendMessage(msg.chat.id, `Error fetching rating for ${mediaInfo.title}`)
      console.error(error)
    }
  }
}

export async function sendMessageFromOverseerrWebhook(chatId: string, overseerrPayload: OverseerrPayload) {
  const { notification_type, event, subject, message, image, media, request } = overseerrPayload;

  const isMovie = media.media_type === 'movie';
  console.log(isMovie);
  const mediaInfo = extractMediaInfoFromOverseerWebhook(subject)
  console.log('Extracted media info: ', mediaInfo)

  try {
    // Fetch IMDb and TMDb data for the movie
    const tmdbInfo = await getTMDBInfoById(+media.tmdbId, isMovie);
    const imdbInfo = isMovie ? await getIMDBInfoById(tmdbInfo.imdbId) : await getIMDBInfoByTitleAndYear(mediaInfo!.title, mediaInfo!.year);
    console.log("imdbInfo: ", imdbInfo)

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
      caption += `<strong>Pedido por: </strong>${request.requestedBy_username}\n`
      caption += `<strong>Estado:</strong> ${
        media.status === 'AVAILABLE' ? 'Disponible' : 'N/A'
      }\n`
      if (!isMovie) {
        caption += `<strong>Temporada/s descargada/s: </strong>${'?'}\n`
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
      if (imdbInfo)
        caption += `<a href="https://www.imdb.com/title/${imdbInfo?.id}">Ver media en IMDB</a>\n`
      caption += `<a href="https://www.themoviedb.org/${media.media_type}/${media.tmdbId}">Ver media en TMDB</a>\n`

      // Send the photo with the caption to the chat
      bot
        .sendPhoto(chatId, tmdbInfo.coverImageUrl, {
          caption,
          parse_mode: 'HTML',
        })
        .catch((error) => {
          console.error(error.message)
        })
    }
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching rating for ${mediaInfo!.title}`);
    console.error(error);
  }
}

export interface OverseerrPayload {
  notification_type: string
  event: string
  subject: string
  message: string
  image: string
  media: Media
  request: Request
}

export interface Media {
  media_type: 'movie' | 'tv'
  tmdbId: string
  tvdbId: string
  status: 'UNKNOWN' | 'PENDING' | 'PROCESSING' | 'PARTIALLY_AVAILABLE' | 'AVAILABLE'
  status4k: 'UNKNOWN' | 'PENDING' | 'PROCESSING' | 'PARTIALLY_AVAILABLE' | 'AVAILABLE'
}

export interface Request {
  request_id: string
  requestedBy_email: string
  requestedBy_username: string
  requestedBy_avatar: string
}