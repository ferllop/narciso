export type IgnoreReviewsConfig = {
	byAuthorName: string[] 
	byMinimumCharactersCountInContent: number 
	byMinimumRating: number
}

export type KnownReview = {
	positionFromOldestBeingZero: number
	authorName: string 
	content: string
}

export type KnownTexts = {
	rejectCookiesButtonText: string
	viewMoreButtonText: string
	viewUntranslatedContentButtonText: string
	reviewsSectionButtonText: string
	sortingButtonText: string
	byNewestOptionButtonText: string
	stars: string
}

export type KnownConfig = {
	review: KnownReview
	texts: KnownTexts
	oldestReviewAuthorName: string
}

export type WebConfig = {
	activate: boolean
	url: string 
	provider: string
	ignoreReviews: IgnoreReviewsConfig
	known: KnownConfig
}

export type PuppeteerConfig = {
	args: string[]
	headless: boolean
	dumpio: boolean
	timeout: number
}

export type Config = {
	puppeteer: PuppeteerConfig
	webs: WebConfig[]
}

const isAbsentOrExplicitlyTrue = (value: any) => [true, undefined].includes(value)
const isExplicitlyTrue = (value: any) => value === true

export const parsePuppeteerConfig = (rawPuppeteerConfig: any): PuppeteerConfig => ({
	...rawPuppeteerConfig,
	args: [ `--lang=${rawPuppeteerConfig.browserLanguage ?? 'en-US'}`, 
		isAbsentOrExplicitlyTrue(rawPuppeteerConfig.sandboxBrowser) ? '' : '--no-sandbox', 
		isExplicitlyTrue(rawPuppeteerConfig.disableSetuidSandbox) ? '--disable-setuid-sandbox' : ''
	],
	headless: isAbsentOrExplicitlyTrue(rawPuppeteerConfig.headless),
	dumpio : isAbsentOrExplicitlyTrue(rawPuppeteerConfig.dumpio),
})

export const parseWebConfig = (rawWebConfig: any) => ({
	...rawWebConfig,
	provider: rawWebConfig.provider ?? new URL(rawWebConfig.url).hostname,
	ignoreReviews: {
		byAuthorName: rawWebConfig.ignoreReviews?.byAuthorName ?? [],
		byMinimumRating: rawWebConfig.ignoreReviews?.byMinimumRating ?? 0,
		byMinimumCharactersCountInContent: rawWebConfig.ignoreReviews?.byMinimumCharactersCountInContent ?? 0,
	},
})

export const parseWebsConfig = (rawWebsConfig: any): WebConfig[] => rawWebsConfig.map(parseWebConfig)

export const parseConfig = (rawConfig: any): Config => ({
	puppeteer: parsePuppeteerConfig(rawConfig.puppeteer),
	webs: parseWebsConfig(rawConfig.webs),
})

