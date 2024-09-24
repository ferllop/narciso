import { Provider, WebConfig } from "../config/config.js"
import { LogFunction } from "../logger/logger.js"
import { getProvider } from "./providers/provider.js"
import { Browser, ErrorWithCode } from "./puppeteer-actions.js"
import { Review } from "./review.js"

export const scrapeWebs = async (log: LogFunction, logInLoop: LogFunction, browser: Browser, websConfig: WebConfig<Provider>[]) => {
    let reviews: Review[] = []
    for (const webConfig of websConfig) {
        if (!webConfig.activate) {
            continue
        }
        try {
            const providerScraper = getProvider(webConfig.provider)(log, logInLoop, browser)
            const start = new Date()
            log.add(`######## Start ${webConfig.title} ########`)
            log.add(`Starting at: ${start}\n`)
            const providerReviews = await providerScraper(webConfig)
            const finish = new Date()
            log.add(`\nFinished at: ${finish}`)
            log.add(`\nDuration: ${(finish.getTime() - start.getTime()) / 1000} seconds`)
            log.add(`######## Finish ${webConfig.title} ########\n\n`)
            reviews = [...reviews, ...providerReviews]
        } catch (ex: unknown) {
            if (ex instanceof ErrorWithCode) {
                log.add(`There was an error scraping the ${webConfig.provider} provider: ${ex.message} and the content of the page is this:`)
                log.add(ex.content)
            } else if (ex instanceof Error) {
                log.add(`There was an error scraping the ${webConfig.provider} provider: ${ex.message}`)
            } else {
                log.add(`Something wrong happened: ${ex}`)
            }
            return []
        }
    }
    return reviews
}
