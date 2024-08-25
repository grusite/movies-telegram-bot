// @ts-ignore
import faparser from 'faparser'
import type { FAApiResponse, FAMedia } from '../../types/Filmaffinity'
import { logger } from '../logger.js'

/**
 * Fetches detailed Filmaffinity information for a given media title.
 *
 * @param {string} query - The query string of the media.
 * @param {string} console - To set the logs of the function. Defaults false
 * @returns {Promise<Object>} A promise that resolves to an object containing detailed information about the movie or tv serie, including title, year, type, cover image URL, plot, and rating details (total rating and number of votes). If no data is found, it returns an object with null values for rating and number of votes.
 */
export async function getFilmaffinittyInfoByQuery(query: string, logs = true) {
  try {
    const res: FAApiResponse = await faparser.search({
      query,
      lang: 'en',
      type: faparser.TITLE,
      start: 0,
    })
    logs ? logger.info('Fimaffinity search result', res) : undefined;

    if (res.count && Object.keys(res.result[0]).length > 0) {
      const faMedia = res.result[0];

      return {
        id: faMedia?.id,
        title: faMedia?.title,
        type: '',
        coverImageUrl: faMedia?.thumbnail,
        genres: '',
        plot: '',
        rating: {
          total: faMedia?.rating,
          numVotes: parseFloat(faMedia?.votes.replace(/,/g, '')), // Remove commas (format is '8,546') and set to number
        },
      }
    }
    return null
  } catch (err) {
    const error = err as Error
    logger.error('Error fetching data from fimaffinity:', error.message)
  }
}
