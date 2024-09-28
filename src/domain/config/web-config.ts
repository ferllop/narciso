export type Provider = 'google' | 'bodasnet'

export type RawWebConfig<P extends Provider> = AddSpecificConfig<UnespecificRawWebConfig<P>>

type AddSpecificConfig<T extends UnespecificRawWebConfig<Provider>> = 
	T extends UnespecificRawWebConfig<infer P> 
		? P extends keyof SpecificsMap 
			? T & {specific: SpecificsMap[P]} 
			: T
		: T

type UnespecificRawWebConfig<P extends Provider> = {
	title: string
	activate: boolean
	useInTests?: boolean
	url: string 
	timeout?: number
	ignoreReviews?: RawIgnoreReviewsConfig 
	provider: P 
}

export type RawIgnoreReviewsConfig = {
	byAuthorName?: string[] 
	byMinimumCharactersCountInContent?: number 
	byMinimumRating?: number
}

export interface SpecificsMap {}	

export type WebConfig<P extends Provider> = RawWebConfig<P> & {
	timeout: number
	ignoreReviews: IgnoreReviewsConfig
}

export type IgnoreReviewsConfig = Required<RawIgnoreReviewsConfig>

