import fs from 'node:fs'
import configData from '../config.json' assert {type: 'json'}
import { starOfService } from './star-of-service.js'
import { WebConfig, configParser } from './config-parser.js'
import { consoleLogger, createLog, onlyOnErrorLogger } from './logger.js'
import { launch } from 'puppeteer'
import { createGoogleReviewsScraper } from './google.js'
import { Review } from './review.js'

const onlyErrorLog = createLog(onlyOnErrorLogger)
const consoleLog = createLog(consoleLogger)

const config = configParser(configData)
const browser = await launch()
const providers: Record<string, (webConfig: WebConfig) => Promise<Review[]>> = {
    google: createGoogleReviewsScraper(consoleLog, onlyErrorLog, config.puppeteer.timeout, browser),
    star_of_service: starOfService(config),
}

let reviews: Review[] = []
for (const webConfig of config.webs) {
    if (!webConfig.activate) {
        continue
    }
    try {
        let providerReviews = await providers[webConfig.provider](webConfig)
        reviews = [...reviews, ...providerReviews]
    } catch (ex: unknown) {
        if (ex instanceof Error) {
            console.log(`There was an error scraping the ${webConfig.provider} provider: ` + ex.message)
        }
        continue
    }
}

fs.writeFile('./reviews.json', JSON.stringify(reviews, null, 2), err => {
    if (err) {
        console.error(err)
        return
    }
})
await browser.close()
