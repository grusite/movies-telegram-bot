export type FAApiResponse = {
  more: boolean
  count: number
  result: FAMedia
}

export type FAMedia = Array<{
  id: string
  url: string
  country: {
    imgCountry: string
    country: string
  }
  year: string
  thumbnail: string
  title: string
  directors: Array<{
    name: string
    request: { query: string; type: string; lang: string }
  }>
  cast: Array<{
    name: string
    request: { query: string; type: string; lang: string }
  }>
  rating: string
  votes: string
}>
