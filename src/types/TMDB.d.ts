export type TMDbMediaSearchResponse = {
  page: number
  total_pages: number
  total_results: number
  results: TMDbMedia[]
}

interface TMDbMedia {
  adult: boolean
  backdrop_path: string
  genre_ids: number[]
  id: number
  original_language: string
  original_title?: string
  original_name?: string
  overview: string
  popularity: number
  poster_path: string
  release_date?: string
  first_air_date?: string
  title?: string
  name?: string
  video?: boolean
  vote_average: number
  vote_count: number
}

export type TMDbMovieDetailResponse = {
  adult: boolean
  backdrop_path: string
  budget: number
  genres: Genre[]
  homepage: string
  id: number
  imdb_id: string
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  release_date: string
  revenue: number
  runtime: number
  spoken_languages: SpokenLanguage[]
  status: string
  tagline: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export type TMDbSeriesDetailResponse = {
  adult: boolean
  backdrop_path: string
  created_by: CreatedBy[]
  episode_run_time: number[]
  first_air_date: string
  genres: Genre[]
  homepage: string
  id: number
  in_production: boolean
  languages: string[]
  last_air_date: string
  last_episode_to_air: LastEpisodeToAir
  name: string
  next_episode_to_air: any
  networks: Network[]
  number_of_episodes: number
  number_of_seasons: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  seasons: Season[]
  spoken_languages: SpokenLanguage[]
  status: string
  tagline: string
  type: string
  vote_average: number
  vote_count: number
}

interface CreatedBy {
  id: number
  credit_id: string
  name: string
  gender: number
  profile_path: string
}

interface Genre {
  id: number
  name: string
}

interface ProductionCompany {
  id: number
  logo_path: any
  name: string
  origin_country: string
}

interface ProductionCountry {
  iso_3166_1: string
  name: string
}

interface SpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

interface LastEpisodeToAir {
  id: number
  name: string
  overview: string
  vote_average: number
  vote_count: number
  air_date: string
  episode_number: number
  episode_type: string
  production_code: string
  runtime: number
  season_number: number
  show_id: number
  still_path: string
}

interface Network {
  id: number
  logo_path: string
  name: string
  origin_country: string
}

interface Season {
  air_date: string
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string
  season_number: number
  vote_average: number
}

export function isTMDBMovie(media: unknown): media is TMDbMovieDetailResponse {
  return (
    (media as TMDbMovieDetailResponse).title !== undefined &&
    (media as TMDbMovieDetailResponse).original_title !== undefined
  )
}

export function isTMDBSeries(media: unknown): media is TMDbSeriesDetailResponse {
  return (
    (media as TMDbSeriesDetailResponse).name !== undefined &&
    (media as TMDbSeriesDetailResponse).original_name !== undefined
  )
}




export interface TMDBCreditsResponse {
  id: number
  cast: Cast[]
  crew: CreditCrew[]
}

interface Cast {
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path?: string
  cast_id: number
  character: string
  credit_id: string
  order: number
}

interface CreditCrew {
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path?: string
  credit_id: string
  department: string
  job: string
}





export interface TMDBMovieReleaseDatesResponse {
  id: number
  results: Result[]
}

interface Result {
  iso_3166_1: string
  release_dates: ReleaseDate[]
}

interface ReleaseDate {
  certification: string
  descriptors: string[]
  iso_639_1: string
  note: string
  release_date: string
  type: number
}

/*
Release	              | Type
Premiere              | 1
Theatrical (limited)	| 2
Theatrical            | 3
Digital	              | 4
Physical              | 5
TV                    | 6
*/


export interface TMDBReleaseEpisodesResponse {
  _id: string
  air_date: string
  episodes: Episode[]
  name: string
  overview: string
  id: number
  poster_path: string
  season_number: number
  vote_average: number
}

export interface Episode {
  air_date: string
  episode_number: number
  episode_type: string
  id: number
  name: string
  overview: string
  production_code: string
  runtime?: number
  season_number: number
  show_id: number
  still_path?: string
  vote_average: number
  vote_count: number
  crew: EpisodeCrew[]
  guest_stars: GuestStar[]
}

export interface EpisodeCrew {
  job: string
  department: string
  credit_id: string
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path?: string
}

export interface GuestStar {
  character: string
  credit_id: string
  order: number
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path?: string
}


