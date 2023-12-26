const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')

// replace with your Telegram token and IMDb API key
const token = '6433264597:AAGfjlOkBsovl2EEiFwupg8gemMkhpPDDSw'
const rapidAPIKey = '08e8713494msh7bfae9ef06af2e0p129ff7jsn6d025c3487a9'
const rapidAPIHost = 'moviesdatabase.p.rapidapi.com'

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })

bot.on('message', (msg) => {
  // Check if the message is from 'Overseer' bot
  console.log(msg.from);
  console.log(msg);
//   if (msg.from.is_bot && msg.from.first_name === 'Overseer') {
    const { title, year } = extractMovieInfo(msg.text)
    if (title && year) {
      // Fetch IMDb rating
      getImdbRating(title, year)
        .then((res) => {
          console.log("DENTRO", res);
          if (res && Object.keys(res).length > 0) {
            console.log('RATING', res.rating)
            console.log('VOTOS', res.numVotes)
            // Send the rating to the chat
            bot.sendMessage(
              msg.chat.id,
              `<strong>IMDb rating</strong> for <strong>${title}: ${
                res.rating
              }/10</strong> <em>(${formatRatingNumber(res.numVotes)} votes)</em>`,
              { parse_mode: 'HTML' }
            )
          }
        })
        .catch((_error) => {
          bot.sendMessage(msg.chat.id, `Error fetching rating for ${title}`)
        })
    }
//   }
})


function extractMovieInfo(messageText) {
  const regex = /^(.+) Request Now Available - (.+) \((\d{4})\)/
  const match = messageText.match(regex);
  console.log('match: ', match)
  if (match && match[2] && match[3]) {
    return {
      title: match[2].trim(),
      year: match[3],
    }
  } else {
    return null
  }
}

async function getImdbRating(title, year) {
  console.log("MovieInfo: ", title, year);
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': rapidAPIKey,
      'X-RapidAPI-Host': rapidAPIHost,
    },
  }

  try {
    const res = await axios.request({
      ...options,
      url: `https://moviesdatabase.p.rapidapi.com/titles/search/title/${encodeURIComponent(title)}`,
      params: { exact: 'true' },
    })
    console.log("Search Result", res.data)
    if (res.data && res.data.entries > 0 && res.data.results.length > 0) {
      res.data.results.map((movie) => {
        console.log('Movie Year', movie.releaseYear.year, year);
      })
      const correctMovie = res.data.results.filter((movie) => movie.releaseYear.year === +year);
      console.log("correctMovie", correctMovie);
      if (correctMovie && correctMovie.length > 0) {
        const res = await axios.request({
          ...options,
          url: `https://moviesdatabase.p.rapidapi.com/titles/${correctMovie[0].id}/ratings`,
        })
        console.log("rating!", res.data)
        return {
          rating: res.data.results.averageRating,
          numVotes: res.data.results.numVotes,
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

function formatRatingNumber(number) {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + ' M'
  } else if (number >= 10000) {
    return Math.round(number / 1000) + ' mil'
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + ' mil'
  } else {
    return number.toString()
  }
}