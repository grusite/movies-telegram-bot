import axios from 'axios'
import type {
  TMDbMediaSearchResponse,
  TMDbMovieDetailResponse,
  TMDbSeriesDetailResponse,
  TMDBCreditsResponse,
  TMDBMovieReleaseDatesResponse,
  TMDBReleaseEpisodesResponse
} from '../../types/TMDB'
import { logger } from '../logger.js'

const API_KEY = process.env.TMDB_API_KEY;
const baseUrl = 'https://api.themoviedb.org/3'
const imgOriginalPath = 'https://image.tmdb.org/t/p/original'

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
  const url = `${baseUrl}/search/${
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
      const detailsUrl = `${baseUrl}/${isMovie ? 'movie' : 'tv'}/${
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
        coverImageUrl: `${imgOriginalPath}${media.poster_path}`,
        plot: media.overview,
        rating: {
          total: Math.round(media.vote_average * 10) / 10,
          numVotes: media.vote_count,
        },
      }
    }
    return null
  } catch (error) {
    logger.error('Error fetching info from TMDb:', error)
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
export async function getTMDBInfoById(id: number, isMovie = true, console = true) {
  try {
    const detailsUrl = `${baseUrl}/${isMovie ? 'movie' : 'tv'}/${
      id
    }?api_key=${API_KEY}&language=es-ES`; 

    const detailsResponse = await axios.get<TMDbMovieDetailResponse | TMDbSeriesDetailResponse>(
      detailsUrl
    )
    console ? logger.info('TMDb details', detailsResponse.data) : null;
    
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
      coverImageUrl: `${imgOriginalPath}${mediaDetail.poster_path}`,
      plot: mediaDetail.overview,
      rating: {
        total: Math.round(mediaDetail.vote_average * 10) / 10,
        numVotes: mediaDetail.vote_count,
      },
    }
  } catch (error) {
    logger.error('Error fetching details from TMDb:', error)
  }
}

/**
 * Retrieves the credits for a movie or TV show from The Movie Database (TMDb).
 * 
 * @param {number} id - The TMDb ID of the movie or TV show.
 * @param {boolean} [isMovie=true] - Flag to indicate if the ID belongs to a movie (true) or TV show (false).
 * @param {boolean} [console=true] - Flag to indicate if the function should log output to the console.
 * @returns {Promise<{ id: number, cast: Array<Object> }>} An object containing the ID and an array of cast members.
 * Each cast member includes details such as name, character played, and profile image path.
 */
export async function getTMDBCredits(id: number, isMovie = true, console = true) {
  try {
    const detailsUrl = `${baseUrl}/${
      isMovie ? 'movie' : 'tv'
    }/${id}/credits?api_key=${API_KEY}&language=es-ES`
    const detailsResponse = await axios.get<TMDBCreditsResponse>(detailsUrl)
    console ? logger.info('TMDb credits', detailsResponse.data) : null

    return {
      id,
      cast: detailsResponse.data.cast.map((c) => {
        return {
          ...c,
          profile_path: c.profile_path ? `${imgOriginalPath}${c.profile_path}` : null,
        }
      }),
    }
  } catch (error) {
    logger.error('Error fetching credits from TMDb:', error)
  }
}

/**
 * Fetches release dates information for a movie from The Movie Database (TMDb).
 * 
 * @param {number} id - The TMDb ID of the movie.
 * @param {boolean} [console=true] - Flag to indicate if the function should log output to the console.
 * @returns {Promise<TMDBMovieReleaseDatesResponse>} An object containing the release dates information for the movie.
 */
export async function getTMDBMovieReleaseDates(id: number, console = true) {
  try {
    const detailsUrl = `${baseUrl}/movie/${id}/release_dates?api_key=${API_KEY}`
    const detailsResponse = await axios.get<TMDBMovieReleaseDatesResponse>(detailsUrl)
    console ? logger.info('TMDb Release Dates', detailsResponse.data) : null

    return detailsResponse.data
  } catch (error) {
    logger.error('Error fetching movie release dates from TMDb:', error)
  }
}

export async function fetchMovieNonAvailableReleasedDates(tmdbId: number) {
  try {
    const releaseDates = tmdbId ? await getTMDBMovieReleaseDates(tmdbId, false) : undefined
    if (releaseDates) {
      const us = releaseDates.results.find((r) => r.iso_3166_1 === 'US')
      const es = releaseDates.results.find((r) => r.iso_3166_1 === 'ES')

      /*
        Type 1 === Premiere
        Type 2 === Cinema (limited)
        Type 3 === Cinema
        Type 4 === Digital
        Type 5 === Physical
        Type 6 === TV 
      */
      const cinemaUSRelease = us?.release_dates.find((d) => d.type === 3)
      const cinemaESRelease = es?.release_dates.find((d) => d.type === 3)
      const digitalUSRelease = us?.release_dates.find((d) => d.type === 4)
      const digitalESRelease = es?.release_dates.find((d) => d.type === 4)
      logger.overseerrMedia(`US cinema release date: ${cinemaUSRelease?.release_date}`)
      logger.overseerrMedia(`ES cinema release date: ${cinemaESRelease?.release_date}`)
      logger.overseerrMedia(`US digital release date: ${digitalUSRelease?.release_date}`)
      logger.overseerrMedia(`ES digital release date: ${digitalESRelease?.release_date}`)

      // 1. Buscar fecha cines en US y ES. Si no existe busco fecha digital en ES y US, y si no existe tampoco entonces busco en todos los países y cojo la fecha temprana y lo pongo en el mensaje como la "original".
      // 2. Si existe cines en US mirar si la fechas es pasada. Si existe y es pasada mensaje y si no es pasada miramos la de ES de cines y si existe (sino existe no hacemos nada) y no es pasada no hacemos nada, si es pasada mensaje. Sino existe en US entonces mirar en ES en cines y hacer lo mismo.
      // 3. El digital ya no lo miramos salvo que como en el paso 1. no existan en cines en US y ES.

      const today = new Date()

      // 1. If there is a US cinema release date and today is before it, return the US/ES release dates
      if(cinemaUSRelease && cinemaUSRelease.release_date && today < new Date(cinemaUSRelease.release_date)) {
        return {
          cinemaUSReleaseDate: cinemaUSRelease.release_date,
          cinemaESReleaseDate: cinemaESRelease?.release_date,
          digitalUSReleaseDate: digitalUSRelease?.release_date,
          digitalESReleaseDate: digitalESRelease?.release_date,
        }
      // 2. If US cinema doesn't exist or is previous than today then check the ES cinema release date
      } else if(cinemaESRelease && cinemaESRelease.release_date && today < new Date(cinemaESRelease.release_date)) {
        return {
          cinemaUSReleaseDate: cinemaUSRelease?.release_date,
          cinemaESReleaseDate: cinemaESRelease.release_date,
          digitalUSReleaseDate: digitalUSRelease?.release_date,
          digitalESReleaseDate: digitalESRelease?.release_date,
        }
      // 3. If ES cinema doesn't exist or is previous than today then check the US digital release date
      } else if(digitalUSRelease && digitalUSRelease.release_date && today < new Date(digitalUSRelease.release_date)) {
        return {
          cinemaUSReleaseDate: cinemaUSRelease?.release_date,
          cinemaESReleaseDate: cinemaESRelease?.release_date,
          digitalUSReleaseDate: digitalUSRelease.release_date,
          digitalESReleaseDate: digitalESRelease?.release_date,
        }
      // 4. If US digital doesn't exist or is previous than today then check the ES digital release date
      } else if(digitalESRelease && digitalESRelease.release_date && today < new Date(digitalESRelease.release_date)) {
        return {
          cinemaUSReleaseDate: cinemaUSRelease?.release_date,
          cinemaESReleaseDate: cinemaESRelease?.release_date,
          digitalUSReleaseDate: digitalUSRelease?.release_date,
          digitalESReleaseDate: digitalESRelease.release_date,
        }
      // 5. If no US/ES release date is found then return the original country release date
      } else if(!cinemaUSRelease && !cinemaESRelease && !digitalUSRelease && !digitalESRelease) {
        for(const r of releaseDates.results) {
          const foreignCountry = r.iso_3166_1;
          const notReleasedDate = r.release_dates.find((d) => d.type === 3 && today < new Date(d.release_date));

          if (notReleasedDate) {
            return {
              foreignCountry,
              cinemaReleaseDate: notReleasedDate.release_date,
              digitalReleaseDate: r.release_dates.find((d) => d.type === 4)?.release_date,
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error checking if movie is fully available:', error)
  }
}

export async function fetchTVSeasonEpisodeNoneReleased(tvId: number, seasonNumber: number) {
  try {
    const response = await axios.get<TMDBReleaseEpisodesResponse>(
      `${baseUrl}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=es-ES`
    )

    logger.overseerrMedia(
      `${tvId} - TV Season ${seasonNumber} release date: ${response.data.air_date}`
    )
    
    const season = response.data
    const today = new Date()

    for (let episode of season.episodes) {
      const releaseDate = new Date(episode.air_date)
      if (releaseDate > today) {
        logger.overseerrMedia(
          `Episode ${episode.episode_number} release date: ${releaseDate}`
        )
        return {
          episodeNumber: episode.episode_number,
          episodeName: episode.name,
          releaseDate,
        } 
      }
    }
  } catch (error) {
    logger.error('Error fetching season data:', error)
  }
}