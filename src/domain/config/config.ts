import { Provider } from '../scraper/providers/provider.js'
import { PuppeteerConfig, RawPuppeteerConfig } from './puppeteer-config.js'
import { RawWebConfig, WebConfig } from './web-config.js'

export type RawConfig = {
	puppeteer: RawPuppeteerConfig
	webs: RawWebConfig<Provider>[]
}

export type Config = {
	puppeteer: PuppeteerConfig
	webs: WebConfig<Provider>[]
}

