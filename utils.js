import axios from "axios";

/**
 * Extracts detailed movie or series information from a message text.
 * 
 * @param {string} messageText - The text of the message containing detailed movie or series information.
 * @returns {Object|null} An object containing the type, title, year, plot, requested by user, request status, and optionally requested seasons of the series, or null if the information cannot be extracted.
 */
export function extractMovieInfo(messageText) {
  const regex = /^(.+) Request Now Available - (.+) \((\d{4})\)\n([\s\S]+?)\n\nRequested By: (.+)\nRequest Status: (.+)(?:\nRequested Seasons: (.+))?/m;
  const match = messageText.match(regex);
  if (match) {
    return {
      type: match[1].trim(),
      title: match[2].trim(),
      year: match[3],
      plot: match[4].trim(),
      requestedBy: match[5].trim(),
      requestStatus: match[6].trim(),
      requestedSeasons: match[7] ? match[7].trim() : undefined,
    };
  } else {
    return null;
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
 * @returns {Promise<Object>} A promise that resolves to an object containing detailed information about the movie, including title, year, type, cover image URL, plot, and rating details (total rating and number of votes). If no data is found, it returns an object with null values for rating and number of votes.
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
      params: { exact: 'true', info: 'base_info' },
    })
    console.log('IMDd title search result', res.data)

    if (res.data && res.data.entries > 0 && res.data.results.length > 0) {
      const filteredByYear = res.data.results.filter((m) => m.releaseYear?.year === +year)[0]

      const imdbMovie =
        res.data.entries > 1
          ? filteredByYear || res.data.results[0]
          : res.data.results[0]

      return {
        id: imdbMovie.id,
        title: imdbMovie.originalTitleText?.text,
        type: imdbMovie.titleType?.text,
        coverImageUrl: imdbMovie.primaryImage?.url,
        plot: imdbMovie.plot?.plotText?.plainText,
        rating: {
          total: imdbMovie.ratingsSummary?.aggregateRating,
          numVotes: imdbMovie.ratingsSummary?.voteCount,
        },
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching data from IMDb:', error);
    throw error;
  }
}


/**
 * Fetches detailed information from TMDb API for a given title and year.
 * 
 * @param {string} title - The title of the movie or series.
 * @param {string} year - The release year of the movie or series.
 * @param {boolean} isMovie - Indicates if the title is a movie (true) or series (false).
 * @returns {Promise<Object>} A promise that resolves to an object containing the title, genres, type, seriesInfo, cover image URL, plot, and rating from TMDb.
 */
export async function getTmdbInfo(title, year, isMovie = true) {
  console.log(`TMDB MovieInfo: Title - ${title}, Year - ${year}, isMovie - ${isMovie}`);
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/search/${isMovie ? 'movie' : 'tv'}?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(title)}&year=${year}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;
    console.log('TMDb results', results);
    // Filter results to match the provided year as well.
    const media = results.find(
      (m) =>
        (isMovie ? m.original_title : m.original_name).toLowerCase() === title.toLowerCase() &&
        (isMovie ? m.release_date : m.first_air_date).startsWith(year.toString())
    )

    if (media) {
      const detailsUrl = `https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${media.id}?api_key=${apiKey}&language=es-ES`;
      const detailsResponse = await axios.get(detailsUrl);
      console.log('TMDb details', detailsResponse.data);

      return {
        id: media.id,
        title: {
          original: isMovie ? media.original_title : media.original_name,
          translated: isMovie ? media.title : media.name,
          tagline: detailsResponse.data.tagline,
        },
        genres: detailsResponse.data.genres.map((g) => g.name),
        type: isMovie ? 'Película' : 'Serie',
        numberOfEpisodes: isMovie ? undefined : detailsResponse.data.number_of_episodes,
        numberOfSeasons: isMovie ? undefined : detailsResponse.data.number_of_seasons,
        coverImageUrl: `https://image.tmdb.org/t/p/original${media.poster_path}`,
        plot: media.overview,
        rating: {
          total: media.vote_average,
          numVotes: media.vote_count,
        },
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching data from TMDb:', error);
    throw error;
  }
}