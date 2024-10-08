import { Config, RawConfig } from './config.js'
import { RawWebConfig, WebConfig } from './web-config.js'
import { PuppeteerConfig, RawPuppeteerConfig } from './puppeteer-config.js'
import { Provider } from '../scraper/providers/provider.js'

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

export const parseWebConfig = <P extends Provider>(rawWebConfig: RawWebConfig<P>): WebConfig<P> => ({
		...rawWebConfig,
		timeout: rawWebConfig.timeout ?? 30_000,
		ignoreReviews: {
			byAuthorName: rawWebConfig.ignoreReviews?.byAuthorName ?? [],
			byMinimumRating: rawWebConfig.ignoreReviews?.byMinimumRating ?? 0,
			byMinimumCharactersCountInContent: rawWebConfig.ignoreReviews?.byMinimumCharactersCountInContent ?? 0,
		},
	})

export const parseWebsConfig = <P extends Provider>(rawWebsConfig: RawWebConfig<P>[]): WebConfig<P>[] => rawWebsConfig.map(parseWebConfig)

export const parseConfig = (rawConfig: RawConfig): Config => ({
	puppeteer: parsePuppeteerConfig(rawConfig.puppeteer),
	webs: parseWebsConfig(rawConfig.webs),
})

export const hasFinalLogArgument = () => process.argv.some(arg => arg === 'final-log')

export const hasProvider = <P extends Provider>
	(provider: P) => (webConfig: {provider: Provider}): webConfig is RawWebConfig<P>|WebConfig<P> => 
		webConfig.provider === provider
