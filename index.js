import TelegramBot from "node-telegram-bot-api";
import translate from 'translate'
import { extractMovieInfo, getImdbInfo, formatRatingNumber } from './utils.js'

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })

bot.on('message', async (msg) => {
    console.log("Original message: ", msg);
    // Check if the message is from 'Overseer' bot
    // if (msg.from.is_bot && msg.from.first_name === 'Overseer') {}
    const movieInfo = extractMovieInfo(msg.text);
    console.log("Extracted movie info: ", movieInfo);
    if (movieInfo) {
      try {
        // Fetch IMDb rating
        const imdbInfo = await getImdbInfo(movieInfo.title, movieInfo.year)

        if (imdbInfo && Object.keys(imdbInfo).length > 0) {
          const translatedPlot = movieInfo.plot.length > imdbInfo.plot?.original.length ? await translate(movieInfo.plot, {
            from: 'en',
            to: 'es',
            engine: 'google',
          }) : imdbInfo.plot?.translated;
           
          // Construct the caption
          let caption = `<strong>Nueva ${imdbInfo.type?.translated}: ${imdbInfo.title} - ${imdbInfo.year}</strong>\n`
          caption += `${translatedPlot}\n\n`
          caption += `<strong>Pedido por: </strong>${movieInfo.requestedBy}\n`
          caption += `<strong>Estado: </strong>${await translate(movieInfo.requestStatus, {
            from: 'en',
            to: 'es',
            engine: 'google',
          })}\n`
          caption += `<strong>Rating:</strong>\n`
          caption += `    - <strong>IMDB</strong>: <strong>${
              imdbInfo.rating?.total
          }/10</strong> <em>(${formatRatingNumber(imdbInfo.rating?.numVotes)} votos)</em>\n\n`
          caption += `<a href="${msg.entities?.[3]?.url ?? '#'}">Ver media en Overseer</a>\n`
          caption += `<a href="https://www.imdb.com/title/${imdbInfo.id}">Ver media en IMDB</a>\n`

          // Send the photo with the caption to the chat
          bot.sendPhoto(msg.chat.id, imdbInfo.coverImageUrl, {
            caption,
            parse_mode: 'HTML',
          })
        }
      } catch(error) {
        bot.sendMessage(msg.chat.id, `Error fetching rating for ${title}`)
        console.error(error);
      }
    }
})