import { hasFinalLogArgument } from "../config/config-parser.js"
import { WebConfig } from "../config/web-config.js"
import { LogEntryFormatter, tap } from "../logger/log-entry-formatter.js"
import { LogEntries, Log, Logger } from "../logger/logger.js"
import { Provider } from "../scraper/providers/provider.js"
import { Browser } from "../scraper/puppeteer-actions.js"
import { Review } from "../scraper/review.js"
import { scrapeWeb } from "./scrape-web.js"

export const scrapeWebs = 
	async (
		standardFormatter: LogEntryFormatter,
		inLoopFormatter: LogEntryFormatter,
		browser: Browser,
		websConfig: WebConfig<Provider>[]): Promise<[LogEntries, Review[]]> => {

	const [log, logInLoop, getEntries] = createLogs(standardFormatter, inLoopFormatter)	

	let reviews: Review[] = []
	for (const webConfig of websConfig) {
		if (!webConfig.activate) {
			continue
		}
		const providerReviews = await scrapeWeb(log, logInLoop, browser, webConfig)
		reviews = [...reviews, ...providerReviews]
	}

	return [getEntries(), reviews] as const
}

const createLogs = 
	(
		standardFormatter: LogEntryFormatter,
		inLoopFormatter: LogEntryFormatter): [standardLog: Log, inLoopLog: Log, () => LogEntries] =>{

	const toConsole = tap(console.log)
	const selectOutput = (l: LogEntryFormatter) => hasFinalLogArgument() ? l : toConsole(l)

	const logger = new Logger(selectOutput(standardFormatter), [])
	const inLoopLog = logger.withFormatter(selectOutput(inLoopFormatter))

	return [logger.log.bind(logger), inLoopLog.log.bind(inLoopLog), logger.getEntries.bind(logger)]
}
