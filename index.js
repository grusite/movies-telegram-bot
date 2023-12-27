import TelegramBot from "node-telegram-bot-api";
import { extractMovieInfo, getImdbInfo, getTmdbInfo, formatRatingNumber } from './utils.js'

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })

bot.on('message', async (msg) => {
    console.log("Original message: ", msg);
    // Check if the message is from 'Overseer' bot
    // if (msg.from.is_bot && msg.from.first_name === 'Overseer') {}
    const movieInfo = extractMovieInfo(msg.text);
    console.log("Extracted movie info: ", movieInfo);
    if (movieInfo) {
      try {
        // Fetch IMDb and TMDb data for the movie
        const imdbInfo = await getImdbInfo(movieInfo.title, movieInfo.year);
        const tmdbInfo = await getTmdbInfo(movieInfo.title, movieInfo.year, movieInfo.type === 'Movie');

        if (tmdbInfo) {
          /* Movie info (title+desc) */
          let caption = `<strong>Nueva ${tmdbInfo.type} - ${tmdbInfo.title?.translated} (${movieInfo.year})</strong>\n`
          caption += `<strong>(${imdbInfo?.type || tmdbInfo.type} - ${tmdbInfo.title?.original} (${
            movieInfo.year
          }))</strong>\n`
          caption += `<strong>[${tmdbInfo.genres.join(", ")}]</strong>\n`
          caption += `\n`
          caption += `<strong>${tmdbInfo.title?.tagline}</strong>\n`
          caption += `${tmdbInfo.plot.length > 600 ? tmdbInfo.plot.slice(0, 600)+'...' : tmdbInfo.plot}\n`
          caption += `\n`

          /* Requested info */
          caption += `<strong>Pedido por: </strong>${movieInfo.requestedBy}\n`
          caption += `<strong>Estado: </strong> ${
            movieInfo.requestStatus === 'Available' ? 'Disponible' : movieInfo.requestStatus
          }\n`
          if (tmdbInfo.type === 'Serie') {
            caption += `<strong>Temporada/s descargada/s: </strong>${movieInfo.requestedSeasons}\n`
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
            movieInfo.type === 'Movie' ? 'movie' : 'tv'
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
            });
        }
      } catch(error) {
        bot.sendMessage(msg.chat.id, `Error fetching rating for ${movieInfo.title}`)
        console.error(error);
      }
    }
})

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
  process.exit(1);
})

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled Rejection:', reason.message);
})