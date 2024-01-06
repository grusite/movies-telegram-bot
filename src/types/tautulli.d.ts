export interface TautulliNotificationPayload {
  title: string
  user: string
  player: string
  action: string
  media_type: string
  serie_info: SerieInfo
  transcode_info: TranscodeInfo
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
}
