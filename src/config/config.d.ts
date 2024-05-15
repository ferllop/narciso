import type { GoogleSpecificConfig } from '../providers/google/google.config.js'

export type RawConfig = {
	puppeteer: RawPuppeteerConfig
	webs: RawWebConfig<Provider>[]
}
export type Config = {
	puppeteer: PuppeteerConfig
	webs: WebConfig<Provider>[]
}

export type RawPuppeteerConfig = {
	browserLanguage?: string
	headless?: boolean
	dumpio?: boolean
	sandboxBrowser?: boolean,
	disableSetuidSandbox?: boolean,
}

export type PuppeteerConfig = Omit<RawPuppeteerConfig, 'browserLanguage' | 'sandboxBrowser' | 'disableSetuidSandbox'> & {
	args: string[]
}

export type WebConfig<P extends Provider> = RawWebConfig<P> & {
	timeout: number
	ignoreReviews: IgnoreReviewsConfig
}
export type IgnoreReviewsConfig = Required<RawIgnoreReviewsConfig>
export type Provider = 'google' | 'bodasnet'
export type RawWebConfig<P extends Provider> = {
	title: string
	activate: boolean
	useInTests?: boolean
	url: string 
	timeout?: number
	ignoreReviews?: RawIgnoreReviewsConfig 
	provider: P 
}  & SpecificConfig<P>

export type RawIgnoreReviewsConfig = {
	byAuthorName?: string[] 
	byMinimumCharactersCountInContent?: number 
	byMinimumRating?: number
}

type SpecificConfig<P extends Provider> = 
	P extends 'google' ? { specific: GoogleSpecificConfig } :
	{}

