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
	timeout: number
	sandboxBrowser?: true,
	disableSetuidSandbox?: true,
}
export type PuppeteerConfig = Omit<RawPuppeteerConfig, 'browserLanguage' | 'sandboxBrowser' | 'disableSetuidSandbox'> & {
	args: string[]
}

export type RawWebConfig<T extends SpecificWebConfig = SpecificWebConfig> = RawCommonWebConfig & T 
export type WebConfig<T extends SpecificWebConfig = SpecificWebConfig> = CommonWebConfig & T
export type CommonWebConfig = RawCommonWebConfig & {
	ignoreReviews: IgnoreReviewsConfig
}
export type IgnoreReviewsConfig = Required<RawIgnoreReviewsConfig>
export type Provider = 'google' | 'starOfService'
export type RawCommonWebConfig = {
	activate: boolean
	url: string 
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

