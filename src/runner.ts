import { Config } from "./config/config.js"
import { LogFunction } from "./logger/logger.js"
import { ProviderScraper } from "./providers/provider.js"
import { Review } from "./review.js"

export const runner = async (log: LogFunction, config: Config, scrape: ProviderScraper) => {
    let reviews: Review[] = []
    for (const webConfig of config.webs) {
        if (!webConfig.activate) {
            continue
        }
        try {
            log.add(`######## Start ${webConfig.title} ########\n`)
            log.add(`Starting at: ${new Date()}\n`)
            const providerReviews = await scrape(webConfig)
            log.add(`Finished at: ${new Date()}\n`)
            log.add(`######## Finish ${webConfig.title} ########\n\n`)
            reviews = [...reviews, ...providerReviews]
        } catch (ex: unknown) {
            if (ex instanceof Error) {
                log.add(`There was an error scraping the ${webConfig.provider} provider: ${ex.message}`)
            } else {
                log.add(`Something wrong happened: ${ex}`)
            }
            return []
        }
    }
    return reviews
}
