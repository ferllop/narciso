import fs from 'node:fs'
import configData from '../config.json' assert {type: 'json'}
import { scrapeGoogleUrl } from './google.js'
import { starOfService } from './star-of-service.js'
import { WebConfig, configParser } from './config-parser.js'
import { Bot } from './bot.js'

export type Review = {
    provider: string
    authorName: string
    rating: number
    content: string
}

(async () => {
    const logger = {
        logStart: console.info, 
        logFinish: console.info, 
        logError: console.error
    }
    const config = configParser(configData)
    const bot = Bot(logger, config)
    const browser = await bot.launchBrowser()
    const providers: Record<string, (webConfig: WebConfig) => Promise<Review[]>> = {
        google: scrapeGoogleUrl(bot, browser),
        star_of_service: starOfService(config),
    }

    let reviews: Review[] = []
    for (const web of config.webs) {
        if (!web.activate) {
            continue
        }
        try {
            let providerReviews = await providers[web.provider](web)
            reviews = [...reviews, ...providerReviews]
        } catch (ex: unknown) {
            if (ex instanceof Error) {
                console.log(`There was an error scraping the ${web.provider} provider: ` + ex.message)
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
})()
