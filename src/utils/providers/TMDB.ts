import axios from 'axios'
import type {
  TMDbMediaSearchResponse,
  TMDbMovieDetailResponse,
  TMDbSeriesDetailResponse,
} from '../../types/TMDB'
import { logger } from '../logger.js'
import { TautulliLastEpisodeNotificationPayload } from 'src/types/tautulli'

const API_KEY = process.env.TMDB_API_KEY;

/**
 * Fetches detailed information from TMDb API for a given title and year.
 *
 * @param {string} title - The title of the movie or series.
 * @param {string} year - The release year of the movie or series.
 * @param {boolean} isMovie - Indicates if the title is a movie (true) or series (false).
 * @returns {Promise<Object>} A promise that resolves to an object containing the title, genres, type, seriesInfo, cover image URL, plot, and rating from TMDb.
 */
export async function getTMDBInfoByTitleAndYear(title: string, year: number, isMovie = true) {
  logger.info(`TMDB MovieInfo: Title - ${title}, Year - ${year}, isMovie - ${isMovie}`)
  const url = `https://api.themoviedb.org/3/search/${
    isMovie ? 'movie' : 'tv'
  }?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(title)}&year=${year}`

  try {
    const response = await axios.get<TMDbMediaSearchResponse>(url)
    const results = response.data.results
    logger.info('TMDb results', results)
    // Filter results to match the provided year as well.
    const media = results.find(
      (m) =>
        (isMovie ? m.original_title! : m.original_name!).toLowerCase() === title.toLowerCase() &&
        (isMovie ? m.release_date! : m.first_air_date!).startsWith(year.toString())
    )

    if (media) {
      const detailsUrl = `https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${
        media.id
      }?api_key=${API_KEY}&language=es-ES`
      const detailsResponse = await axios.get<TMDbMovieDetailResponse | TMDbSeriesDetailResponse>(
        detailsUrl
      )
      logger.info('TMDb details', detailsResponse.data)

      return {
        id: media.id,
        title: {
          original: isMovie ? media.original_title : media.original_name,
          translated: isMovie ? media.title : media.name,
          tagline: detailsResponse.data.tagline,
        },
        genres: detailsResponse.data.genres.map((g) => g.name),
        type: isMovie ? 'Película' : 'Serie',
        numberOfEpisodes: isMovie
          ? undefined
          : (detailsResponse.data as TMDbSeriesDetailResponse).number_of_episodes,
        numberOfSeasons: isMovie
          ? undefined
          : (detailsResponse.data as TMDbSeriesDetailResponse).number_of_seasons,
        coverImageUrl: `https://image.tmdb.org/t/p/original${media.poster_path}`,
        plot: media.overview,
        rating: {
          total: Math.round(media.vote_average * 10) / 10,
          numVotes: media.vote_count,
        },
      }
    }
    return null
  } catch (error) {
    logger.error('Error fetching data from TMDb:', error)
    throw error
  }
}

/**
 * Fetches detailed information from TMDb API for a given id.
 *
 * @param {number} id - The id of the movie or series.
 * @param {boolean} isMovie - Indicates if the title is a movie (true) or series (false).
 * @returns {Promise<Object>} A promise that resolves to an object containing the title, genres, type, seriesInfo, cover image URL, plot, and rating from TMDb.
 */
export async function getTMDBInfoById(id: number, isMovie = true) {
  const detailsUrl = `https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${
    id
  }?api_key=${API_KEY}&language=es-ES`;
  const detailsResponse = await axios.get<TMDbMovieDetailResponse | TMDbSeriesDetailResponse>(
    detailsUrl
  )
  logger.info('TMDb details', detailsResponse.data)
  
  // TS guards to type it correctly
  const mediaDetail = detailsResponse.data as TMDbMovieDetailResponse | TMDbSeriesDetailResponse;

  return {
    id,
    imdbId: (mediaDetail as TMDbMovieDetailResponse).imdb_id,
    title: {
      original: isMovie
        ? (mediaDetail as TMDbMovieDetailResponse).original_title
        : (mediaDetail as TMDbSeriesDetailResponse).original_name,
      translated: isMovie
        ? (mediaDetail as TMDbMovieDetailResponse).title
        : (mediaDetail as TMDbSeriesDetailResponse).name,
      tagline: mediaDetail.tagline,
    },
    genres: mediaDetail.genres.map((g) => g.name),
    type: isMovie ? 'película' : 'serie',
    seasons: (mediaDetail as TMDbSeriesDetailResponse).seasons,
    numberOfEpisodes: isMovie
      ? undefined
      : (mediaDetail as TMDbSeriesDetailResponse).number_of_episodes,
    numberOfSeasons: isMovie
      ? undefined
      : (detailsResponse.data as TMDbSeriesDetailResponse).number_of_seasons,
    coverImageUrl: `https://image.tmdb.org/t/p/original${mediaDetail.poster_path}`,
    plot: mediaDetail.overview,
    rating: {
      total: Math.round(mediaDetail.vote_average * 10) / 10,
      numVotes: mediaDetail.vote_count,
    },
  }
}