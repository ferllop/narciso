import fs from 'node:fs'
import configData from '../config.js'
import { starOfService } from './star-of-service.js'
import { parseConfig } from './config/config-parser.js'
import { createLogFunction, createParagraphsOnLog, indentLog, onlyErrorLogFormatter, simpleLogFormatter, tap } from './logger.js'
import { launch } from 'puppeteer'
import { createGoogleReviewsScraper } from './google.js'
import { Review } from './review.js'
import { GoogleSpecificConfig, SpecificWebConfig, WebConfig } from './config/config.js'

const logMem: string[] = []
const log = createLogFunction(tap(console.log)(simpleLogFormatter), logMem)
const onlyOnErrorLog = createLogFunction(tap(console.log)(onlyErrorLogFormatter), logMem)

const config = parseConfig(configData)
const browser = await launch(config.puppeteer)

const createScraper = (webConfig: WebConfig<SpecificWebConfig>) => {
    switch(webConfig.provider) {
        case 'google': 
            return () => createGoogleReviewsScraper(log, onlyOnErrorLog, browser)(webConfig as WebConfig<GoogleSpecificConfig>)
        case 'starOfService': 
            return () => starOfService(config)(webConfig.url)
    }
}

let reviews: Review[] = []
for (const webConfig of config.webs) {
    if (!webConfig.activate) {
        continue
    }
    try {
        log.add(`######## ${webConfig.title} ########\n`)
        log.add(`Starting at: ${new Date()}\n`)
        const providerReviews = await createScraper(webConfig)()
        reviews = [...reviews, ...providerReviews]
    } catch (ex: unknown) {
        if (ex instanceof Error) {
            console.log(`There was an error scraping the ${webConfig.provider} provider: ` + ex.message)
        }
        continue
    }
}

fs.writeFile('./reviews.last.log', 
    createParagraphsOnLog(indentLog(logMem)).join('\n'), 
    () => {}
)

fs.writeFile('./reviews.json', 
    JSON.stringify(reviews, null, 2),
    err => {
        if (err) {
            console.error(err)
            return
        }
    })

await browser.close()
