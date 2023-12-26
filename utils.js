import axios from "axios";
import translate from "translate";

/**
 * Extracts detailed movie information from a message text.
 * 
 * @param {string} messageText - The text of the message containing detailed movie information.
 * @returns {Object|null} An object containing the type, title, year, plot, requested by user, and request status of the movie, or null if the information cannot be extracted.
 */
export function extractMovieInfo(messageText) {
  const regex =
    /^(.+) Request Now Available - (.+) \((\d{4})\)\n([\s\S]+)\n\nRequested By: (.+)\nRequest Status: (.+)/
  const match = messageText.match(regex)
  if (match) {
    return {
      type: match[1].trim(),
      title: match[2].trim(),
      year: match[3],
      plot: match[4].trim(),
      requestedBy: match[5].trim(),
      requestStatus: match[6].trim(),
    }
  } else {
    return null
  }
}

/**
 * Formats a number to a more readable string with "mil" for thousands and "M" for millions.
 *
 * @param {number} number - The number to format.
 * @returns {string} A formatted string representing the number in a more readable form.
 */
export function formatRatingNumber(number) {
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

/**
 * Fetches detailed IMDb information for a given movie title and year.
 * 
 * @param {string} title - The title of the movie.
 * @param {string} year - The release year of the movie.
 * @returns {Promise<Object>} A promise that resolves to an object containing detailed information about the movie, including title, year, type (original and translated), cover image URL, plot (original and translated), and rating details (total rating and number of votes). If no data is found, it returns an object with null values for rating and number of votes.
 */
export async function getImdbInfo(title, year) {
  console.log(`MovieInfo: Title - ${title}, Year - ${year}`)
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.RAPID_API_HOST,
    },
  }

  try {
    const res = await axios.request({
      ...options,
      url: `https://moviesdatabase.p.rapidapi.com/titles/search/title/${encodeURIComponent(title)}`,
      params: { exact: 'true', info: 'base_info', year },
    })
    console.log('IMDd title search result', res.data)

    if (res.data && res.data.entries > 0 && res.data.results.length > 0) {
      const imdbMovie = res.data.results[0];

      const originalLanguage = imdbMovie.plot.language.id.split('-')[0];
      const translatedText = await translate(imdbMovie.plot.plotText.plainText, {
        from: originalLanguage,
        to: 'es',
        engine: 'google',
      })
      console.log('Original Plot: ', imdbMovie.plot.plotText.plainText)
      console.log('Translated: ', translatedText)
      const translatedType = await translate(imdbMovie.titleType.text, {
        from: originalLanguage,
        to: 'es',
        engine: 'google',
      })
      console.log('Original Type: ', imdbMovie.titleType.text)
      console.log('Translated: ', translatedType)

      return {
        id: imdbMovie.id,
        title,
        year,
        type: {
          original: imdbMovie.titleType.text,
          translated: translatedType,
        },
        coverImageUrl: imdbMovie.primaryImage.url,
        plot: {
          original: imdbMovie.plot.plotText.plainText,
          translated: translatedText,
        },
        rating: {
          total: imdbMovie.ratingsSummary.aggregateRating,
          numVotes: imdbMovie.ratingsSummary.voteCount,
        }
      }
    }
    return {
      rating: null,
      numVotes: null,
    }
  } catch (error) {
    console.error(error)
  }
}
