import axios from 'axios'
import type { IMDbMedia, IMDbTitleSearchResponse } from '../types/IMDB'

/**
 * Fetches detailed IMDb information for a given movie title and year.
 *
 * @param {string} id - The id of the media.
 * @returns {Promise<Object>} A promise that resolves to an object containing detailed information about the movie, including title, year, type, cover image URL, plot, and rating details (total rating and number of votes). If no data is found, it returns an object with null values for rating and number of votes.
 */
export async function getIMDBInfoById(id: string) {
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.RAPID_API_HOST,
    },
  }

  try {
    const res = await axios.request<IMDbTitleSearchResponse>({
      ...options,
      url: `https://moviesdatabase.p.rapidapi.com/titles/${id}`,
      params: { info: 'base_info' },
    })
    console.log('IMDd id search result', res.data)

    if (res.data?.results && Object.keys(res.data.results).length > 0) {
      const imdbMovie = res.data.results as unknown as IMDbMedia;

      return {
        id: imdbMovie.id,
        title: imdbMovie.originalTitleText?.text,
        type: imdbMovie.titleType?.text,
        coverImageUrl: imdbMovie.primaryImage?.url,
        genres: imdbMovie.genres?.genres.map((genre) => genre.text),
        plot: imdbMovie.plot?.plotText?.plainText,
        rating: {
          total: imdbMovie.ratingsSummary?.aggregateRating,
          numVotes: imdbMovie.ratingsSummary?.voteCount,
        },
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching data from IMDb:', error)
    throw error
  }
}

/**
 * Fetches detailed IMDb information for a given movie title and year.
 *
 * @param {string} title - The title of the movie.
 * @param {string} year - The release year of the movie.
 * @returns {Promise<Object>} A promise that resolves to an object containing detailed information about the movie, including title, year, type, cover image URL, plot, and rating details (total rating and number of votes). If no data is found, it returns an object with null values for rating and number of votes.
 */
export async function getIMDBInfoByTitleAndYear(title: string, year: number) {
  console.log(`MovieInfo: Title - ${title}, Year - ${year}`)
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.RAPID_API_HOST,
    },
  }

  try {
    let res = await axios.request<IMDbTitleSearchResponse>({
      ...options,
      url: `https://moviesdatabase.p.rapidapi.com/titles/search/title/${encodeURIComponent(title)}`,
      params: { exact: 'true', info: 'base_info' },
    })
    console.log('IMDd title search result', res.data)

    // If the title is not found in IMDb, split the title into two parts and try again
    if (res.data && res.data.entries === 0) {
      res = await axios.request<IMDbTitleSearchResponse>({
        ...options,
        url: `https://moviesdatabase.p.rapidapi.com/titles/search/title/${encodeURIComponent(
          title.split(' ').slice(0, 2).join(' ')
        )}`,
        params: { exact: 'true', info: 'base_info' },
      })
      console.log('IMDd new title search result', res.data)
    }

    if (res.data && res.data.entries > 0 && res.data.results.length > 0) {
      const filteredByYear = res.data.results.filter((m) => m.releaseYear?.year === +year)[0]

      const imdbMovie =
        res.data.entries > 1 ? filteredByYear || res.data.results[0] : res.data.results[0]

      return {
        id: imdbMovie.id,
        title: imdbMovie.originalTitleText?.text,
        type: imdbMovie.titleType?.text,
        coverImageUrl: imdbMovie.primaryImage?.url,
        genres: imdbMovie.genres?.genres.map((genre) => genre.text),
        plot: imdbMovie.plot?.plotText?.plainText,
        rating: {
          total: imdbMovie.ratingsSummary?.aggregateRating,
          numVotes: imdbMovie.ratingsSummary?.voteCount,
        },
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching data from IMDb:', error)
    throw error
  }
}
