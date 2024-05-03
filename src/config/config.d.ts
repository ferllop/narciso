export type RawConfig = {
	puppeteer: RawPuppeteerConfig
	webs: RawWebConfig<SpecificWebConfig>[]
}
export type Config = {
	puppeteer: PuppeteerConfig
	webs: WebConfig<SpecificWebConfig>[]
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

export type RawWebConfig<T extends SpecificWebConfig> = RawCommonWebConfig & T 
export type WebConfig<T extends SpecificWebConfig> = CommonWebConfig & T
export type CommonWebConfig = RawCommonWebConfig & {
	timeout: number
	ignoreReviews: IgnoreReviewsConfig
}
export type IgnoreReviewsConfig = Required<RawIgnoreReviewsConfig>
export type Provider = 'google' | 'starOfService'
export type RawCommonWebConfig = {
	title: string
	activate: boolean
	useInTests?: boolean
	url: string 
	timeout?: number
	ignoreReviews?: RawIgnoreReviewsConfig
}

export type RawIgnoreReviewsConfig = {
	byAuthorName?: string[] 
	byMinimumCharactersCountInContent?: number 
	byMinimumRating?: number
}

export type SpecificWebConfig = {provider: Provider} | GoogleSpecificConfig 

export type GoogleSpecificConfig = {
	provider: 'google'
	known: GoogleKnownConfig
}

export type GoogleKnownConfig = {
	review: GoogleKnownReview
	texts: GoogleKnownTexts
	oldestReviewAuthorName: string
	reviewPositionFromOldestBeingZero: {
		knownReview: number
		withMoreButton: number
		withViewUntransalatedButton: number
	}
}

export type GoogleKnownReview = {
	authorName: string 
	content: string
}

export type GoogleKnownTexts = {
	rejectCookiesButtonText: string
	viewMoreButtonText: string
	viewUntranslatedContentButtonText: string
	reviewsSectionButtonText: string
	sortingButtonText: string
	byNewestOptionButtonText: string
	stars: string
}

