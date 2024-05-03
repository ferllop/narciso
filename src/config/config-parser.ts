import { Config, PuppeteerConfig, RawConfig, RawPuppeteerConfig, RawWebConfig, SpecificWebConfig, WebConfig } from './config.js'

const isAbsentOrExplicitlyTrue = (value: any) => [true, undefined].includes(value)
const isExplicitlyTrue = (value: any) => value === true

export const parsePuppeteerConfig = (rawPuppeteerConfig: RawPuppeteerConfig): PuppeteerConfig => ({
	args: [ `--lang=${rawPuppeteerConfig.browserLanguage ?? 'en-US'}`, 
		isAbsentOrExplicitlyTrue(rawPuppeteerConfig.sandboxBrowser) ? '' : '--no-sandbox', 
		isExplicitlyTrue(rawPuppeteerConfig.disableSetuidSandbox) ? '--disable-setuid-sandbox' : ''
	],
	headless: isAbsentOrExplicitlyTrue(rawPuppeteerConfig.headless),
	dumpio : isAbsentOrExplicitlyTrue(rawPuppeteerConfig.dumpio),
})

export const parseWebConfig = <T extends SpecificWebConfig>(rawWebConfig: RawWebConfig<T>): WebConfig<T> => ({
		...rawWebConfig,
		timeout: rawWebConfig.timeout ?? 30_000,
		ignoreReviews: {
			byAuthorName: rawWebConfig.ignoreReviews?.byAuthorName ?? [],
			byMinimumRating: rawWebConfig.ignoreReviews?.byMinimumRating ?? 0,
			byMinimumCharactersCountInContent: rawWebConfig.ignoreReviews?.byMinimumCharactersCountInContent ?? 0,
		},
	})

export const parseWebsConfig = <T extends SpecificWebConfig>(rawWebsConfig: RawWebConfig<T>[]): WebConfig<T>[] => rawWebsConfig.map(parseWebConfig)

export const parseConfig = (rawConfig: RawConfig): Config => ({
	puppeteer: parsePuppeteerConfig(rawConfig.puppeteer),
	webs: parseWebsConfig(rawConfig.webs),
})

export const hasSilentArgument = () => process.argv.some(arg => arg === 'silent')

