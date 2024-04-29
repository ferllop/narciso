import { Config, PuppeteerConfig, RawConfig, RawPuppeteerConfig, RawWebConfig, WebConfig } from './config.js'

const isAbsentOrExplicitlyTrue = (value: any) => [true, undefined].includes(value)
const isExplicitlyTrue = (value: any) => value === true

export const parsePuppeteerConfig = (rawPuppeteerConfig: RawPuppeteerConfig): PuppeteerConfig => ({
	timeout: rawPuppeteerConfig.timeout,
	args: [ `--lang=${rawPuppeteerConfig.browserLanguage ?? 'en-US'}`, 
		isAbsentOrExplicitlyTrue(rawPuppeteerConfig.sandboxBrowser) ? '' : '--no-sandbox', 
		isExplicitlyTrue(rawPuppeteerConfig.disableSetuidSandbox) ? '--disable-setuid-sandbox' : ''
	],
	headless: isAbsentOrExplicitlyTrue(rawPuppeteerConfig.headless),
	dumpio : isAbsentOrExplicitlyTrue(rawPuppeteerConfig.dumpio),
})

export const parseWebConfig = (rawWebConfig: RawWebConfig): WebConfig => ({
		...rawWebConfig,
		ignoreReviews: {
			byAuthorName: rawWebConfig.ignoreReviews?.byAuthorName ?? [],
			byMinimumRating: rawWebConfig.ignoreReviews?.byMinimumRating ?? 0,
			byMinimumCharactersCountInContent: rawWebConfig.ignoreReviews?.byMinimumCharactersCountInContent ?? 0,
		},
	})

export const parseWebsConfig = (rawWebsConfig: RawWebConfig[]): WebConfig[] => rawWebsConfig.map(parseWebConfig)

export const parseConfig = (rawConfig: RawConfig): Config => ({
	puppeteer: parsePuppeteerConfig(rawConfig.puppeteer),
	webs: parseWebsConfig(rawConfig.webs),
})

