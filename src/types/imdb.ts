export type IMDbTitleSearchResponse = {
  page: number
  next: number | null
  entries: number
  results: IMDbMedia[]
}

type IMDbMedia = {
  _id: string
  id: string
  ratingsSummary: RatingsSummary
  episodes: any
  primaryImage: PrimaryImage
  titleType: TitleType
  genres: Genres
  titleText: TitleText
  originalTitleText: OriginalTitleText
  releaseYear: ReleaseYear
  releaseDate: ReleaseDate
  runtime: any
  series: any
  meterRanking: any
  plot: Plot
}

interface RatingsSummary {
  aggregateRating: number
  voteCount: number
  __typename: string
}

interface PrimaryImage {
  id: string
  width: number
  height: number
  url: string
  caption: Caption
  __typename: string
}

interface Caption {
  plainText: string
  __typename: string
}

interface TitleType {
  text: string
  id: string
  isSeries: boolean
  isEpisode: boolean
  __typename: string
}

interface Genres {
  genres: Genre[]
  __typename: string
}

interface Genre {
  text: string
  id: string
  __typename: string
}

interface TitleText {
  text: string
  __typename: string
}

interface OriginalTitleText {
  text: string
  __typename: string
}

interface ReleaseYear {
  year: number
  endYear: any
  __typename: string
}

interface ReleaseDate {
  day: any
  month: any
  year: number
  __typename: string
}

interface Plot {
  plotText: PlotText
  language: Language
  __typename: string
}

interface PlotText {
  plainText: string
  __typename: string
}

interface Language {
  id: string
  __typename: string
}