import { Provider, WebConfig } from "../config/config.js"
import { Logger } from "../logger/logger.js"
import { Browser } from "../scraper/puppeteer-actions.js"
import { Review } from "../scraper/review.js"
import { scrapeWeb } from "./scrape-web.js"

export const scrapeWebs = async (log: Logger, logInLoop: Logger, browser: Browser, websConfig: WebConfig<Provider>[]) => {
	let reviews: Review[] = []
	for (const webConfig of websConfig) {
		if (!webConfig.activate) {
			continue
		}
		const providerReviews = await scrapeWeb(log, logInLoop, browser, webConfig)
		reviews = [...reviews, ...providerReviews]
	}
	return reviews
}
