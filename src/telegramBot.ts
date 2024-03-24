import TelegramBot from "node-telegram-bot-api";
import { getIMDBInfoById, getIMDBInfoByTitleAndYear } from './utils/providers/IMDB.js'
import {
  getTMDBInfoById,
  getTMDBInfoByTitleAndYear,
  fetchMovieNonAvailableReleasedDates,
  fetchTVSeasonEpisodeNoneReleased,
  getTMDBCredits,
} from './utils/providers/TMDB.js'
import { formatRatingNumber, extractMediaInfoFromOverseerBot, extractMediaInfoFromOverseerWebhook, formatQuality, formatDate } from './utils/index.js'
import { logger } from "./utils/logger.js";
import type { OverseerrPayload } from "./types/overseerr.js"
import type { TautulliTranscodingNotificationPayload, TautulliLastEpisodeNotificationPayload } from './types/tautulli.js'
import { supabaseInstance } from './db/index.js'
import { Database } from "./db/database.types.js";

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
 * Sends a formatted announcement message to a specified Telegram chat.
 * 
 * This function takes a text message, formats it with additional descriptive information and markdown for emphasis,
 * and sends it to the provided Telegram chat ID.
 * 
 * @param {string} chatId - The Telegram chat ID where the announcement will be sent.
 * @param {string} text - The text of the announcement.
 * @throws Will throw an error if sending the message fails.
 */
export async function readAndSendAnnouncement(chatId: string, text: string) {
  const formattedText =
    `📣 *¡Anuncio para la comunidad!* 📣\n\n` +
    `${text}\n\n` +
    `🌟 *¡Manténganse al tanto para más novedades!* 🌟`

  try {
    await bot.sendMessage(chatId, formattedText, { parse_mode: 'Markdown' })
    logger.overseerrMedia('Announcement sent: ', formattedText)
  } catch (error) {
    logger.error('Error sending announcement: ', error)
    throw error
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

    // Check if the media is available in our country
    if (notification_type !== 'MEDIA_AVAILABLE') {
      let caption: string = '';

      if (media.media_type === 'movie') {
        /* START - DB INSERTION */
        // Insert data into DB to know which user has asked for the media
        const { error } = await supabaseInstance.from('media_info').insert([
          {
            user_name: request?.requestedBy_username || 'unknown',
            media_type: isMovie ? 'movie' : 'tv_serie',
            media_name: subject,
            is_requested: true,
          },
        ])
        if (error) {
          logger.error(error.message)
          throw error.message
        }
        /* END - DB INSERTION */

        const releaseDates = +media.tmdbId
          ? await fetchMovieNonAvailableReleasedDates(+media.tmdbId)
          : undefined
        if (releaseDates) {
          caption =
            `🎬 <strong>¡Alerta de Viaje en el Tiempo!</strong> 🕒\n\n` +
            `Parece que <a href="${request?.requestedBy_avatar ?? '#'}">${
              request?.requestedBy_username ?? 'alguien'
            }</a> ha intentado adelantarse en el tiempo para descargar <strong>${subject}</strong>, pero aún no se ha estrenado.\n` +
            `¡En cuanto se entrene en <strong>digital en España</strong>, el servidor la descargará automáticamente! 🚀\n\n`

          if (releaseDates.foreignCountry) {
            caption +=
              `<strong>Fecha de lanzamiento (${releaseDates.foreignCountry})</strong>\n` +
              `   Cines: ${formatDate(new Date(releaseDates.cinemaReleaseDate))}\n` +
              `   Digital: ${
                releaseDates.digitalReleaseDate
                  ? formatDate(new Date(releaseDates.digitalReleaseDate))
                  : 'No disponible'
              }\n`
          } else {
            caption +=
              `🇪🇸 <strong>Fecha de lanzamiento (ES)</strong>\n` +
              `   Cines: ${
                releaseDates.cinemaESReleaseDate
                  ? formatDate(new Date(releaseDates.cinemaESReleaseDate))
                  : 'No disponible'
              }\n` +
              `   Digital: ${
                releaseDates.digitalESReleaseDate
                  ? formatDate(new Date(releaseDates.digitalESReleaseDate))
                  : 'No disponible'
              }\n` +
              `🇺🇸 <strong>Fecha de lanzamiento (US)</strong>\n` +
              `   Cines: ${
                releaseDates.cinemaUSReleaseDate
                  ? formatDate(new Date(releaseDates.cinemaUSReleaseDate))
                  : 'No disponible'
              }\n` +
              `   Digital: ${
                releaseDates.digitalUSReleaseDate
                  ? formatDate(new Date(releaseDates.digitalUSReleaseDate))
                  : 'No disponible'
              }\n`
          }
        }
      } else if (
        media.media_type === 'tv' &&
        extra?.[0]?.name === 'Requested Seasons' &&
        extra?.[0]?.value
      ) {
        const seasons = extra[0].value.split(',')
        /* START - DB INSERTION */
        // Insert data into DB to know which user has asked for the media
        const toInsert = seasons.map((season) => ({
          user_name: request?.requestedBy_username || 'unknown',
          media_type: isMovie ? 'movie' : 'tv_serie',
          media_name: subject,
          media_season: +season,
          is_requested: true,
        })) as Database['public']["Tables"]["media_info"]["Insert"][]

        const { error } = await supabaseInstance.from('media_info').insert(toInsert)
        if (error) {
          logger.error(error.message)
          throw error.message
        }
        /* END - DB INSERTION */

        const seasonInfo = +media.tmdbId
          ? await fetchTVSeasonEpisodeNoneReleased(+media.tmdbId, seasons)
          : undefined

        if (seasonInfo) {
          caption =
            `🎬 <strong>¡Alerta de Viaje en el Tiempo!</strong> 🕒\n\n` +
            `Parece que <a href="${request?.requestedBy_avatar ?? '#'}">${
              request?.requestedBy_username ?? 'alguien'
            }</a> ha intentado adelantarse en el tiempo al descargar la <strong>temporada ${
              seasonInfo.season
            }</strong> de la serie <strong>${subject}</strong>; parece que todavía no está 100% disponible.\n\n` +
            `¡En cuanto se entrene la temporada entera el servidor la descargará automáticamente! 🚀\n\n` +
            `<strong>📅 Fecha de lanzamiento</strong> del siguiente episodio:\n` +
            `<strong>${seasonInfo.episodeName} - ${formatDate(seasonInfo.releaseDate)}</strong>\n`
        }
      }

      if (caption) {
        await bot.sendPhoto(chatId, image, {
          caption,
          parse_mode: 'HTML',
        })
      }

      return;
    }

    // Fetch IMDb and TMDb data for the movie
    const tmdbInfo = +media.tmdbId ? await getTMDBInfoById(+media.tmdbId, isMovie, false) : undefined;
    const imdbInfo =
      isMovie && tmdbInfo?.imdbId
        ? await getIMDBInfoById(tmdbInfo.imdbId, false)
        : tmdbInfo?.title?.original
          ? await getIMDBInfoByTitleAndYear(tmdbInfo.title.original, mediaInfo!.year)
          : await getIMDBInfoByTitleAndYear(mediaInfo!.title, mediaInfo!.year)

    const credits = +media.tmdbId ? await getTMDBCredits(+media.tmdbId, isMovie, false) : undefined;

    if (tmdbInfo) {
      /* Movie info (title+desc) */
      let caption = `<strong>Nueva ${tmdbInfo.type} - ${tmdbInfo.title?.translated} (${mediaInfo!.year})</strong>\n`
      caption += `<strong>New ${imdbInfo?.type || tmdbInfo.type} - ${tmdbInfo.title?.original} (${
        mediaInfo!.year
      })</strong>\n`
      caption += `<strong>Géneros:</strong> ${tmdbInfo.genres.join(', ')}\n`
      if (credits && credits.cast && credits.cast.length ) {
        caption += `<strong>Reparto: </strong>`;
        for(const [index, cast] of credits.cast.entries()) {
          caption += `<a href="${cast.profile_path ?? '#'}">${cast?.name}</a> (${cast?.character})`;
          if(index === 2) {
            caption += '...';
            break;
          }
          caption += ', ';
        }
        caption += '\n'
      }
      caption += `\n`
      caption += `<strong>${tmdbInfo.title?.tagline}</strong>\n`
      if(tmdbInfo.plot) {
        caption += `${
          tmdbInfo.plot.length > 500 ? tmdbInfo.plot.slice(0, 500) + '[...]' : tmdbInfo.plot
        }\n`
      } else if(imdbInfo && imdbInfo.plot) {
        caption += `${
          imdbInfo.plot.length > 500 ? tmdbInfo.plot.slice(0, 500) + '[...]' : imdbInfo.plot
        }\n`
      } else {
        caption += `${message}\n`
      }
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
        const downloadedSeasons = extra[0].value!.split(', ');
        const downloadedEpisodes = downloadedSeasons.map((season) => {
          return tmdbInfo.seasons.find((s) => s.season_number === +season)?.episode_count;
        });

        caption += `\n`
        caption += `<strong>Temporada/s descargada/s: </strong>${downloadedSeasons.join("-")}\n`
        caption += `<strong>Episodios descargados: </strong>${downloadedEpisodes.join("-")}\n`
        caption += `<strong>Número total de episodios: </strong>${tmdbInfo.numberOfEpisodes}\n`
        caption += `<strong>Número total de temporadas: </strong>${tmdbInfo.numberOfSeasons}\n`
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
      await bot.sendPhoto(chatId, tmdbInfo.coverImageUrl, {
        caption,
        parse_mode: 'HTML',
      })
    } else if(imdbInfo) {
      /* Movie info (title+desc) */
      let caption = `<strong>New ${imdbInfo.type} - ${imdbInfo.title} (${
        mediaInfo!.year
      })</strong>\n`
      caption += `<strong>Genres:</strong> ${imdbInfo.genres.join(', ')}\n`
      caption += `\n`
      caption += `${
        imdbInfo.plot.length > 600 ? imdbInfo.plot.slice(0, 600) + '...' : imdbInfo.plot
      }\n`
      caption += `\n`

      /* Requested info */
      if (request) {
        caption += `<strong>Pedido por: </strong><a href="${request.requestedBy_avatar}">${request.requestedBy_username}</a>\n`
      }
      caption += `<strong>Estado:</strong> ${
        notification_type === 'MEDIA_AVAILABLE' ? 'Disponible' : notification_type
      }\n`

      /* Ratings */
      caption += `<strong>Rating:</strong>\n`
      if (imdbInfo.rating?.total && imdbInfo.rating?.numVotes) {
        caption += `    - <strong>IMDB</strong>: <strong>${
          imdbInfo.rating.total
        }/10</strong> <em>(${formatRatingNumber(imdbInfo.rating.numVotes)} votos)</em>\n`
        caption += `\n`
      }

      /* Important links */
      if (imdbInfo && imdbInfo.id) {
        caption += `<a href="https://www.imdb.com/title/${imdbInfo.id}">Ver media en IMDB</a>\n`
      }

      // Send the photo with the caption to the chat
      await bot.sendPhoto(chatId, imdbInfo.coverImageUrl, {
        caption,
        parse_mode: 'HTML',
      })
    } else {
      /* Movie info (title+desc) */
      let caption = `<strong>${event} ${subject}</strong>\n`
      caption += `${message}\n`
      caption += `\n`

      /* Requested info */
      if (request) {
        caption += `<strong>Pedido por: </strong><a href="${request.requestedBy_avatar}">${request.requestedBy_username}</a>\n`
      }
      caption += `<strong>Estado:</strong> ${
        notification_type === 'MEDIA_AVAILABLE' ? 'Disponible' : notification_type
      }\n`

      await bot.sendPhoto(chatId, image, {
        caption,
        parse_mode: 'HTML',
      })
    }
  } catch (err) {
    const error = err as Error;
    bot.sendMessage(chatId, `Ups! Siento deciros que ha habido un error al intentar procesar la información de: ${subject}`);
    logger.error(error.message);
    throw error.message;
  }
}

export async function sendTranscodingMessageFromTautulliWebhook(  
  chatId: string,
  tautulliPayload: TautulliTranscodingNotificationPayload
) {
  const { user, title, themoviedb_id, media_type, player, transcode_info, action } = tautulliPayload

  /* START - DB INSERTION */
  // Insert data into DB to know which user is transcoding
  const { error } = await supabaseInstance.from('media_info').insert([
    {
      user_name: user,
      media_type: media_type === 'movie' ? 'movie' : 'tv_serie',
      media_name: title,
      is_transcoding: true,
    },
  ])
  if (error) {
    logger.error(error.message)
    throw error.message
  }
  /* END - DB INSERTION */

  if (transcode_info.transcode_decision === 'Direct Play') throw new Error('Direct Play')

  const originalQualityFormatted = transcode_info.original_bitrate
    ? formatQuality(transcode_info.original_bitrate)
    : 'N/A'
  const streamQualityFormatted = transcode_info.stream_bitrate
    ? formatQuality(transcode_info.stream_bitrate)
    : 'N/A'
  const originalVideoQualityFormatted = transcode_info.video_bitrate
    ? formatQuality(transcode_info.video_bitrate)
    : 'N/A'
  const actualVideoQualityFormatted = transcode_info.stream_video_bitrate
    ? formatQuality(transcode_info.stream_video_bitrate)
    : 'N/A'
  const originalAudioQualityFormatted = transcode_info.audio_bitrate
    ? formatQuality(transcode_info.audio_bitrate)
    : 'N/A'
  const actualAudioQualityFormatted = transcode_info.stream_audio_bitrate
    ? formatQuality(transcode_info.stream_audio_bitrate)
    : 'N/A'

  const none = 'N/A'
  const caption =
    `🚨 <strong>${title} - Transcoding alert</strong> 🚨\n\n` +
    `👤 <strong>Usuario:</strong> ${user}\n` +
    `🔄 <strong>Acción:</strong> ${action}\n` +
    `▶️ <strong>Reproductor:</strong> ${player}\n` +
    `📦 <strong>Container:</strong> ${transcode_info.container} -> ${transcode_info.transcode_container}\n` +
    `\n` +
    `🎬 <strong>Vídeo:</strong> ${transcode_info.video_decision} (${
      transcode_info.video_codec ?? none
    } ${transcode_info.video_resolution ?? none}` +
    ` -> ${transcode_info.transcode_video_codec ?? none} ${
      transcode_info.stream_video_resolution
    })\n` +
    `🔊 <strong>Audio:</strong> ${transcode_info.audio_decision} (${
      transcode_info.audio_codec ?? none
    } -> ${transcode_info.transcode_audio_codec ?? none})\n` +
    `🎬 <strong>Subtítulos:</strong> ${transcode_info.subtitle_decision} (${
      transcode_info.subtitle_language ?? none
    } - ${transcode_info.subtitle_codec ?? none}` +
    ` ${
      transcode_info.stream_subtitle_codec ? ' -> ' + transcode_info.stream_subtitle_codec : ''
    })\n` +
    `\n` +
    `📊 <strong>Calidad (bitrate)</strong>\n` +
    `       General:\n` +
    `         - Actual: ${streamQualityFormatted}\n` +
    `         - Original: ${originalQualityFormatted}\n` +
    `       Vídeo:\n` +
    `         - Actual: ${actualVideoQualityFormatted} (${transcode_info.stream_video_resolution})\n` +
    `         - Original: ${originalVideoQualityFormatted} (${transcode_info.video_resolution})\n` +
    `       Audio:\n` +
    `         - Actual: ${actualAudioQualityFormatted}\n` +
    `         - Original: ${originalAudioQualityFormatted}\n` +
    `\n\n` +
    `🔥 ¡El NAS está que arde! 🔥`

  try {
    const tmdbInfo = themoviedb_id
      ? await getTMDBInfoById(+themoviedb_id, media_type === 'movie', false)
      : undefined

    tmdbInfo
      ? await bot.sendPhoto(chatId, tmdbInfo.coverImageUrl, {
          caption,
          parse_mode: 'HTML',
        })
      : await bot.sendMessage(chatId, caption, { parse_mode: 'HTML' })
  } catch (err) {
    const error = err as Error
    bot.sendMessage(
      chatId,
      `Ups! Siento deciros que ha habido un error al intentar mandar la info de: ${user} haciendo Transcoding de ${title}`
    )
    logger.error(error.message)
    throw error.message
  }
}

export async function sendEndOfEpisodeMessageFromTautulliWebhook(
  chatId: string,
  tautulliPayload: TautulliLastEpisodeNotificationPayload
) {
  const { user, title, themoviedb_id, media_type, serie_info } = tautulliPayload

  /* START - DB */
  // Check first if the user has already seen the last episode to avoid duplicate notifications
  const { data: hasAlreadySeenLastEpisode, error: selectError } = await supabaseInstance
    .from('media_info')
    .select('is_last_episode')
    .eq('user_name', user)
  if (hasAlreadySeenLastEpisode && hasAlreadySeenLastEpisode.length) {
    logger.tuautlliLastEpisode(`User ${user} has already seen the last episode`);
    throw new Error(`User ${user} has already seen the last episode`);
  };

  // Insert data into DB to know which user has seen the last episode
  const { error: insertError } = await supabaseInstance.from('media_info').insert([
    {
      user_name: user,
      media_type: media_type === 'movie' ? 'movie' : 'tv_serie',
      media_name: title,
      media_season: +serie_info.season_num,
      media_chapter: +serie_info.episode_num,
      is_last_episode: true,
    },
  ])
  if (selectError || insertError) {
    const error = selectError || insertError
    logger.error(error!.message)
    throw error!.message
  }
  /* END - DB */

  let caption =
    `🎬 <strong>¡Atención!</strong> 🎬\n\n` +
    `<strong>${user}</strong> está viendo el último episodio (${serie_info.episode_num}) de la temporada ${serie_info.season_num} de: ` +
    `<strong>'${title}'</strong>\n\n` +
    `¡Prepárense para decir adiós! 🥺`

  try {
    if (media_type === 'movie') throw new Error('No es una serie')

    const tmdbInfo = themoviedb_id ? await getTMDBInfoById(+themoviedb_id, false, false) : undefined

    if (tmdbInfo) {
      const isLastEpisode = tmdbInfo.seasons.some(
        (season) =>
          season.season_number === +serie_info.season_num &&
          season.episode_count === +serie_info.episode_num
      )

      if (isLastEpisode) {
        await bot.sendPhoto(chatId, tmdbInfo.coverImageUrl, {
          caption,
          parse_mode: 'HTML',
        })

        const pollQuestion = `¿Qué hacemos con la temporada ${serie_info.season_num} de ${
          title.split('-')[0]
        }ahora que ${user} se la ha zampado entera?`
        const pollOptions = [
          'Borrarla y hacer espacio para más series 🚀',
          'Guardarla, ya sea porque todavía no la he visto 👀 o porque me la quiero volver a ver en el futuro 🍿',
          'Me la pela, que decida Damián 🔨',
        ]
        await bot.sendPoll(chatId, pollQuestion, pollOptions, { is_anonymous: false })
      } else {
        throw new Error('No es el último episodio')
      }
    } else {
      throw new Error('No se encontró información de la temporada en TMDB')
    }
  } catch (err) {
    const error = err as Error
    logger.error(error.message)
    throw error.message
  }
}