import { Config } from "../config/config.js"
import { LogFunction } from "../logger/logger.js"
import { ProviderScraper } from "./providers/provider.js"
import { ErrorWithCode } from "./puppeteer-actions.js"
import { Review } from "./review.js"

export const runner = async (log: LogFunction, websConfig: Config['webs'], scrape: ProviderScraper) => {
    let reviews: Review[] = []
    for (const webConfig of websConfig) {
        if (!webConfig.activate) {
            continue
        }
        try {
            const start = new Date()
            log.add(`######## Start ${webConfig.title} ########`)
            log.add(`Starting at: ${start}\n`)
            const providerReviews = await scrape(webConfig)
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
