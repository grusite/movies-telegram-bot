/**
 * Extracts detailed movie or series information from the Overseerr bot message text.
 *
 * @param {string} messageText - The text of the message containing detailed movie or series information.
 * @returns {Object|null} An object containing the type, title, year, plot, requested by user, request status, and optionally requested seasons of the series, or null if the information cannot be extracted.
 */
export function extractMediaInfoFromOverseerBot(messageText: string) {
  const regex =
    /^(.+) Request Now Available - (.+) \((\d{4})\)\n([\s\S]+?)\n\nRequested By: (.+)\nRequest Status: (.+)(?:\nRequested Seasons: (.+))?/m
  const match = messageText?.match(regex)

  if (match) {
    return {
      type: match[1].trim(),
      title: match[2].trim(),
      year: +match[3],
      plot: match[4].trim(),
      requestedBy: match[5].trim(),
      requestStatus: match[6].trim(),
      requestedSeasons: match[7] ? match[7].trim() : undefined,
    }
  }
  return null
}

/**
 * Extracts detailed movie or series information from the Overseerr bot message text.
 *
 * @param {string} subject - The title of the movie or series sent by Overseerr.
 * @returns {Object|null} An object containing the title and the year or null if the information cannot be extracted.
 */
export function extractMediaInfoFromOverseerWebhook(subject: string) {
  const regex = /^(.+?)\s\((\d{4})\)$/;
  const match = subject?.match(regex)
  
  if (match) {
    return {
      title: match[1].trim(),
      year: +match[2],
    }
  }
  return null
}

/**
 * Formats a number to a more readable string with "mil" for thousands and "M" for millions.
 *
 * @param {number} number - The number to format.
 * @returns {string} A formatted string representing the number in a more readable form.
 */
export function formatRatingNumber(number: number) {
  if (!number) return

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