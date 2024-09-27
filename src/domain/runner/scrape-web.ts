import { Provider, WebConfig } from "../config/config.js"
import { Logger } from "../logger/logger.js"
import { Browser, ErrorWithCode } from "../scraper/puppeteer-actions.js"
import { scrape } from "../scraper/scraper.js"

export const scrapeWeb = 
	async (logger: Logger, loggerInLoop: Logger, browser: Browser, webConfig: WebConfig<Provider>) => {
	try {
		const start = new Date()
		logger.add(`######## Start ${webConfig.title} ########`)
		logger.add(`Starting at: ${start}\n`)

		const reviews = await scrape(logger.log, loggerInLoop.log, browser, webConfig)

		const finish = new Date()
		logger.add(`\nFinished at: ${finish}`)
		logger.add(`\nDuration: ${(finish.getTime() - start.getTime()) / 1000} seconds`)
		logger.add(`######## Finish ${webConfig.title} ########\n\n`)
		return reviews
	} catch (ex: unknown) {
		if (ex instanceof ErrorWithCode) {
			logger.add(`There was an error scraping the ${webConfig.provider} provider: ${ex.message} and the content of the page is this:`)
			logger.add(ex.content)
		} else if (ex instanceof Error) {
			logger.add(`There was an error scraping the ${webConfig.provider} provider: ${ex.message}`)
		} else {
			logger.add(`Something wrong happened: ${ex}`)
		}
		return []
	}
}
