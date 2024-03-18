import fs from 'node:fs'
import configData from '../config.json' assert {type: 'json'}
import { scrapeGoogleUrl } from './google.js'
import { starOfService } from './star-of-service.js'
import { configParser } from './config-parser.js'
import { Bot } from './bot.js'

(async () => {
    const logger = {
        logStart: console.info, 
        logFinish: console.info, 
        logError: console.error
    }
    const config = configParser(configData)
    const bot = Bot(logger, config)
    const browser = await bot.launchBrowser()
    const providers = {
        google: scrapeGoogleUrl(bot, browser),
        star_of_service: starOfService(config),
    }

    let reviews = []
    for (const web of config.webs) {
        if (!web.activate)
            continue
        try {
            let providerReviews = await providers[web.provider](web)
            await providerReviews.forEach( review => reviews.push(review) )
        } catch (ex) {
            console.log(`There was an error scraping the web titled ${web.title ?? 'untitled'}: ` + ex.message)
            continue
        }
    }
    
    fs.writeFileSync('./reviews.json', JSON.stringify(reviews, null, 2), (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
    await browser.close()
})()
