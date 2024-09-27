import { hasFinalLogArgument } from "../config/config-parser.js"
import { Provider, WebConfig } from "../config/config.js"
import { LogLineFormatter, tap } from "../logger/log-line-formatter.js"
import { Logger, createLogger } from "../logger/logger.js"
import { Browser } from "../scraper/puppeteer-actions.js"
import { Review } from "../scraper/review.js"
import { scrapeWeb } from "./scrape-web.js"

export const scrapeWebs = async (standardFormatter: LogLineFormatter, inLoopFormatter: LogLineFormatter, browser: Browser, websConfig: WebConfig<Provider>[]) => {

	const [log, logInLoop] = createLogs(standardFormatter, inLoopFormatter)	

	let reviews: Review[] = []
	for (const webConfig of websConfig) {
		if (!webConfig.activate) {
			continue
		}
		const providerReviews = await scrapeWeb(log, logInLoop, browser, webConfig)
		reviews = [...reviews, ...providerReviews]
	}

	return [log.getLog(), reviews] as const
}

const createLogs = (standardFormatter: LogLineFormatter,InLoopFormatter: LogLineFormatter): [Logger, Logger] =>{
	const toConsole = tap(console.log)
	const selectOutput = (l: LogLineFormatter) => hasFinalLogArgument() ? l : toConsole(l)

	const logMem: string[] = []
	const log = createLogger(selectOutput(standardFormatter), logMem)
	const inLoopLog = createLogger(selectOutput(InLoopFormatter), logMem)

	return [log, inLoopLog]
}
