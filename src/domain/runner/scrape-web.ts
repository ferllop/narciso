import { Provider, WebConfig } from "../config/config.js"
import { Log } from "../logger/logger.js"
import { Browser, ErrorWithCode } from "../scraper/puppeteer-actions.js"
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
		if (ex instanceof ErrorWithCode) {
			log(`There was an error scraping the ${webConfig.provider} provider: ${ex.message} and the content of the page is this:`)
			log(ex.content)
		} else if (ex instanceof Error) {
			log(`There was an error scraping the ${webConfig.provider} provider: ${ex.message}`)
		} else {
			log(`Something wrong happened: ${ex}`)
		}
		return []
	}
}
