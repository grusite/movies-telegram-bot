export const printRed = (s: string) => `\x1b[31m${s}\x1b[0m`;
export const printGreen = (s: string) => `\x1b[32m${s}\x1b[0m`;
export const printYellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
export const printBlue = (s: string) => `\x1b[34m${s}\x1b[0m`;
export const printMagenta = (s: string) => `\x1b[35m${s}\x1b[0m`;
export const printCyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
export const printWhite = (s: string) => `\x1b[37m${s}\x1b[0m`;
export const printBrightRed = (s: string) => `\x1b[91m${s}\x1b[0m`;
export const printBrightGreen = (s: string) => `\x1b[92m${s}\x1b[0m`;
export const printBrightYellow = (s: string) => `\x1b[93m${s}\x1b[0m`;
export const printBrightBlue = (s: string) => `\x1b[94m${s}\x1b[0m`;
export const printBrightMagenta = (s: string) => `\x1b[95m${s}\x1b[0m`;
export const printBrightCyan = (s: string) => `\x1b[96m${s}\x1b[0m`;
export const printBrightWhite = (s: string) => `\x1b[97m${s}\x1b[0m`;
export const printBgRed = (s: string) => `\x1b[41m${s}\x1b[0m`;
export const printBgGreen = (s: string) => `\x1b[42m${s}\x1b[0m`;
export const printBgYellow = (s: string) => `\x1b[43m${s}\x1b[0m`;
export const printBgBlue = (s: string) => `\x1b[44m${s}\x1b[0m`;
export const printBgMagenta = (s: string) => `\x1b[45m${s}\x1b[0m`;
export const printBgCyan = (s: string) => `\x1b[46m${s}\x1b[0m`;
export const printBgWhite = (s: string) => `\x1b[47m${s}\x1b[0m`;
export const printBgBrightRed = (s: string) => `\x1b[101m${s}\x1b[0m`;
export const printBgBrightGreen = (s: string) => `\x1b[102m${s}\x1b[0m`;
export const printBgBrightYellow = (s: string) => `\x1b[103m${s}\x1b[0m`;
export const printBgBrightBlue = (s: string) => `\x1b[104m${s}\x1b[0m`;
export const printBgBrightMagenta = (s: string) => `\x1b[105m${s}\x1b[0m`;
export const printBgBrightCyan = (s: string) => `\x1b[106m${s}\x1b[0m`;
export const printBgBrightWhite = (s: string) => `\x1b[107m${s}\x1b[0m`;
export const printBrightBgRed = (s: string) => `\x1b[111m${s}\x1b[0m`;
export const printBrightBgGreen = (s: string) => `\x1b[112m${s}\x1b[0m`;
export const printBrightBgYellow = (s: string) => `\x1b[113m${s}\x1b[0m`;
export const printBrightBgBlue = (s: string) => `\x1b[114m${s}\x1b[0m`;
export const printBrightBgMagenta = (s: string) => `\x1b[115m${s}\x1b[0m`;
export const printBrightBgCyan = (s: string) => `\x1b[116m${s}\x1b[0m`;
export const printBrightBgWhite = (s: string) => `\x1b[117m${s}\x1b[0m`;
export const printBgBrightBrightRed = (s: string) => `\x1b[121m${s}\x1b[0m`;
export const printBgBrightBrightGreen = (s: string) => `\x1b[122m${s}\x1b[0m`;
export const printBgBrightBrightYellow = (s: string) => `\x1b[123m${s}\x1b[0m`;
export const printBgBrightBrightBlue = (s: string) => `\x1b[124m${s}\x1b[0m`;
export const printBgBrightBrightMagenta = (s: string) => `\x1b[125m${s}\x1b[0m`;
export const printBgBrightBrightCyan = (s: string) => `\x1b[126m${s}\x1b[0m`;
export const printBgBrightBrightWhite = (s: string) => `\x1b[127m${s}\x1b[0m`;
export const printBrightBrightBgRed = (s: string) => `\x1b[131m${s}\x1b[0m`;
export const printBrightBrightBgGreen = (s: string) => `\x1b[132m${s}\x1b[0m`;
export const printBrightBrightBgYellow = (s: string) => `\x1b[133m${s}\x1b[0m`;
export const printBrightBrightBgBlue = (s: string) => `\x1b[134m${s}\x1b[0m`;
export const printBrightBrightBgMagenta = (s: string) => `\x1b[135m${s}\x1b[0m`;
export const printBrightBrightBgCyan = (s: string) => `\x1b[136m${s}\x1b[0m`;
export const printBrightBrightBgWhite = (s: string) => `\x1b[137m${s}\x1b[0m`;

export const logger = {
  error: (message: string, extra?: unknown) => extra ? console.error(`${printRed('✖')} ${message}`, extra) : console.error(`${printRed('✖')} ${message}`),
  info: (message: string, extra?: unknown) => extra ? console.info(`${printGreen('✔')} ${message}`, extra) : console.info(`${printGreen('✔')} ${message}`),
  overseerrMedia: (message: string, extra?: unknown) => extra ? console.info(`${printBlue('🎥')} ${message}`, extra) : console.info(`${printBlue('🎥')} ${message}`),
  tautulliTranscoding: (message: string, extra?: unknown) => extra ? console.info(`${printMagenta('🔥')} ${message}`, extra) : console.info(`${printMagenta('🔥')} ${message}`),
  tuautlliLastEpisode: (message: string, extra?: unknown) =>
    extra ? console.info(`${printYellow('📺')} ${message}`, extra) : console.info(`${printYellow('📺')} ${message}`),
}
