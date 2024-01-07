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
  media_type: string
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
  transcode_decision: string
  video_decision: string
  audio_decision: string
  container: string
  transcode_container: string
  transcode_video_codec: string
  video_codec: string
  transcode_audio_codec: string
  audio_codec: string
  quality: string
  original_bitrate: string
}
