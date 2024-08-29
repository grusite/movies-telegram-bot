export interface OverseerrPayload {
  server: 'cerveperros' | 'skylate'
  notification_type: 'MEDIA_PENDING' | 'MEDIA_AVAILABLE' | 'MEDIA_AUTO_APPROVED' | 'ISSUE_COMMENT' // There are more unknown types
  event: string
  subject: string
  message: string
  image: string
  media: Media | null
  request: Request | null
  issue: Issue | null
  comment: IssueComment | null
  extra: Extra[]
}

export interface Media {
  media_type: 'movie' | 'tv'
  tmdbId: string
  tvdbId: string
  status: 'UNKNOWN' | 'PENDING' | 'PROCESSING' | 'PARTIALLY_AVAILABLE' | 'AVAILABLE'
  status4k: 'UNKNOWN' | 'PENDING' | 'PROCESSING' | 'PARTIALLY_AVAILABLE' | 'AVAILABLE'
}

export interface Request {
  request_id: string
  requestedBy_email: string
  requestedBy_username: string
  requestedBy_avatar: string
}

export interface Issue {
  issue_id: string
  reportedBy_username: string
  reportedBy_email: string
  reportedBy_avatar: string
}

export interface IssueComment {
  comment_message: string
  commentedBy_username: string
  commentedBy_email: string
  commentedBy_avatar: string
}

export interface Extra {
  name?: string
  value?: string
}
