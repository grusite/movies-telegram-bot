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
  const { notification_type, event, subject, message, image, media, request, extra } = overseerrPayload;

  const isMovie = media?.media_type === 'movie';
  const mediaInfo = extractMediaInfoFromOverseerWebhook(subject)
  console.log('Extracted media info: ', mediaInfo)

  try {
    if(!media || (!mediaInfo && !isMovie)) throw new Error(`No media info found for: ${subject}`)

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
          console.error(error.message)
        })
    }
  } catch (err) {
    const error = err as Error;
    bot.sendMessage(chatId, `Ups! Siento deciros que ha habido un error al intentar procesar la información de: ${subject}`);
    console.error(error.message);
    throw error.message;
  }
}

export interface OverseerrPayload {
  notification_type: 'MEDIA_PENDING' | 'MEDIA_AVAILABLE' | 'ISSUE_COMMENT' // There are more unknown types
  event: string
  subject: string
  message: string
  image: string
  media: Media | null
  request: Request | null
  issue: Issue | null
  comment: IssueComment | null
  extra: Extra[]
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

export interface Issue {
  issue_id: string
  reportedBy_username: string
  reportedBy_email: string
  reportedBy_avatar: string
}

export interface IssueComment {
  comment_message: string
  commentedBy_username: string
  commentedBy_email: string
  commentedBy_avatar: string
}

export interface Extra {
  name?: string
  value?: string
}

// Ejecmplos de Overseerr payloads

/* Series:

Received webhook from Overseer:  {
  "notification_type": "MEDIA_AVAILABLE",
  "event": "Series Request Now Available",
  "subject": "The Mentalist (2008)",
  "message": "Patrick Jane, a former celebrity psychic medium, uses his razor sharp skills of observation and expertise at \"reading\" people to solve serious crimes with the California Bureau of Investigation.",
  "image": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/acYXu4KaDj1NIkMgObnhe4C4a0T.jpg",
  "media": {
    "media_type": "tv",
    "tmdbId": "5920",
    "tvdbId": "82459",
    "status": "PARTIALLY_AVAILABLE",
    "status4k": "UNKNOWN"
  },
  "request": {
    "request_id": "145",
    "requestedBy_email": "grusite@gmail.com",
    "requestedBy_username": "grusite",
    "requestedBy_avatar": "https://plex.tv/users/fe7fa4e4122d2d86/avatar?c=1703683943"
  },
  "issue": null,
  "comment": null,
  "extra": [ { "name": "Requested Seasons", "value": "1" } ]
}
*/

/* Pelis

Received webhook from Overseer: {
  "notification_type": "MEDIA_AVAILABLE",
  "event": "Movie Request Now Available",
  "subject": "Dungeons & Dragons: Honor Among Thieves (2023)",
  "message": "A charming thief and a band of unlikely adventurers undertake an epic heist to retrieve a lost relic, but things go dangerously awry when they run afoul of the wrong people.",
  "image": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/A7AoNT06aRAc4SV89Dwxj3EYAgC.jpg",
  "media": {
    "media_type": "movie",
    "tmdbId": "493529",
    "tvdbId": "",
    "status": "AVAILABLE",
    "status4k": "UNKNOWN"
  },
  "request": {
    "request_id": "141",
    "requestedBy_email": "drinconada@gmail.com",
    "requestedBy_username": "Gudnight",
    "requestedBy_avatar": "https://plex.tv/users/45eb1bbd0c2fb9b5/avatar?c=1703945653"
  },
  "issue": null,
  "comment": null,
  "extra": []
*/