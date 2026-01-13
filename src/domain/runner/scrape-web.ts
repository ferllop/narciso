import { WebConfig } from "../config/web-config.js"
import { Log } from "../logger/logger.js"
import { Provider } from "../scraper/providers/provider.js"
import { Browser } from "../scraper/puppeteer-actions.js"
import { scrape } from "../scraper/scraper.js"

export const scrapeWeb = 
	async (log: Log, logInLoop: Log, browser: Browser, webConfig: WebConfig<Provider>) => {
	try {
		const start = new Date()
		log(`######## Start ${webConfig.title} ########`)
		log(`Starting at: ${start}\n`)

		const reviews = await scrape(log, logInLoop, browser, webConfig)

		const finish = new Date()
		log(`\nFinished at: ${finish}`)
		log(`\nDuration: ${(finish.getTime() - start.getTime()) / 1000} seconds`)
		log(`######## Finish ${webConfig.title} ########\n\n`)

		return reviews

	} catch (ex: unknown) {
		if (ex instanceof Error === false) {
			log(`Something wrong happened: ${ex}`)
		}
		return []
	}
}
