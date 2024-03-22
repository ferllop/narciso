export type IgnoreReviewsConfig = {
	byAuthorName: string[] 
	byMinimumCharactersCountInContent: number 
	byMinimumRating: number
}

export type KnownConfig = {
	review: {
		authorName: string 
		content: string
	}
	rejectCookiesButtonText: string
	viewMoreButtonText: string
	viewUntranslatedContentButtonText: string
	reviewsSectionButtonText: string
	sortingButtonText: string
	byNewestOptionButtonText: string
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

const parsePuppeteerConfigSection = (rawConfig: any): PuppeteerConfig => ({
	...rawConfig.puppeteer,
	args: [ `--lang=${rawConfig.puppeteer?.browserLanguage ?? 'en-US'}`, 
		isAbsentOrExplicitlyTrue(rawConfig.puppeteer?.sandboxBrowser) ? '' : '--no-sandbox', 
		isExplicitlyTrue(rawConfig.puppeteer?.disableSetuidSandbox) ? '--disable-setuid-sandbox' : ''
	],
	headless: isAbsentOrExplicitlyTrue(rawConfig.puppeteer?.headless),
	dumpio : isAbsentOrExplicitlyTrue(rawConfig.puppeteer?.dumpio),
})

const parseWebsConfigSection = (rawConfig: any): WebConfig[] => rawConfig.webs?.map((web: any) => ({
	...web,
	provider: web.provider ?? new URL(web.url).hostname,
	activate: web.activate,
	url: web.url, 
	ignoreReviews: {
		byAuthorName: web.ignore_reviews?.by_author_name ?? [],
		byMinimumRating: web.ignore_reviews?.by_minimum_rating ?? 0,
		byMinimumCharactersCountInContent: web.ignore_reviews?.by_minimum_characters_count_in_content ?? 0,
	},
}))

export const configParser = (rawConfig: any): Config => ({
	puppeteer: parsePuppeteerConfigSection(rawConfig),
	webs: parseWebsConfigSection(rawConfig),
})


