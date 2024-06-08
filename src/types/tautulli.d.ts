export type TautulliTranscodingNotificationPayload = GeneralInfo & {
  transcode_info: TranscodeInfo
}

export type TautulliLastEpisodeNotificationPayload = GeneralInfo & {
  serie_info: SerieInfo
}

export interface GeneralInfo {
  title: string
  user: string
  player: string
  action: string
  media_type: "movie" | "episode"
  themoviedb_id: string
}

export interface SerieInfo {
  episode_name: string
  episode_num: string
  episode_count: string
  season_num: string
  season_count: string
}

export interface TranscodeInfo {
  // Transcoding decition
  transcode_decision: string
  video_decision: string
  audio_decision: string
  subtitle_decision: string
  // Container info
  container: string
  stream_container: string
  transcode_container: string
  // Codecs
  video_codec: string
  transcode_video_codec: string
  audio_codec: string
  transcode_audio_codec: string
  subtitle_codec: string
  stream_subtitle_codec: string
  subtitle_language: string
  // Bitrate
  original_bitrate: string
  video_bitrate: string
  audio_bitrate: string
  stream_bitrate: string
  stream_video_bitrate: string
  stream_audio_bitrate: string
  // Resolution
  video_resolution: string
  stream_video_resolution: string
}
