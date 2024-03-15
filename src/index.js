import fs from 'node:fs'
import configData from '../config.json' assert {type: 'json'}
import { scrapeGoogleUrl } from './google.js'
import { starOfService } from './star-of-service.js'
import { configParser } from './config-parser.js'
import puppeteer from 'puppeteer'

(async () => {
    const config = configParser(configData)
    const browser = await puppeteer.launch(config.puppeteer)
    const providers = {
        google: scrapeGoogleUrl(browser),
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
