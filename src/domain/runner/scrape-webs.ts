import { hasFinalLogArgument } from "../config/config-parser.js"
import { Provider, WebConfig } from "../config/config.js"
import { LogLineFormatter, tap } from "../logger/log-line-formatter.js"
import { Entries, Log, Logger } from "../logger/logger.js"
import { Browser } from "../scraper/puppeteer-actions.js"
import { Review } from "../scraper/review.js"
import { scrapeWeb } from "./scrape-web.js"

export const scrapeWebs = 
	async (
		standardFormatter: LogLineFormatter,
		inLoopFormatter: LogLineFormatter,
		browser: Browser,
		websConfig: WebConfig<Provider>[]): Promise<[Entries, Review[]]> => {

	const [log, logInLoop, getLog] = createLogs(standardFormatter, inLoopFormatter)	

	let reviews: Review[] = []
	for (const webConfig of websConfig) {
		if (!webConfig.activate) {
			continue
		}
		const providerReviews = await scrapeWeb(log, logInLoop, browser, webConfig)
		reviews = [...reviews, ...providerReviews]
	}

	return [getLog(), reviews] as const
}

const createLogs = 
	(
		standardFormatter: LogLineFormatter,
		inLoopFormatter: LogLineFormatter): [standardLog: Log, inLoopLog: Log, () => Entries] =>{

	const toConsole = tap(console.log)
	const selectOutput = (l: LogLineFormatter) => hasFinalLogArgument() ? l : toConsole(l)

	const logger = new Logger(selectOutput(standardFormatter), [])
	const inLoopLog = logger.withFormatter(selectOutput(inLoopFormatter))

	return [logger.log.bind(logger), inLoopLog.log.bind(inLoopLog), logger.getLog.bind(logger)]
}
