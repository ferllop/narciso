import { writeFile } from 'node:fs/promises'
import { WebConfig } from "../config/web-config.js"
import { Log } from "../logger/logger.js"
import { Provider, getSteps } from "./providers/provider.js"
import { Browser, ErrorWithHTML, Page } from "./puppeteer-actions.js"
import { Review, createReviewValidator } from "./review.js"

export type Steps<P extends Provider>
= (log: Log, logInLoop: Log, webConfig: WebConfig<P>)
=> (page: Page)
=> Promise<Review[]>

export const scrape = 
    async <P extends Provider>(log: Log, logInLoop: Log, browser: Browser, webConfig: WebConfig<P>) => {
    const page = await browser.newPage()
    await page.setUserAgent({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0'
    })
    try {
        return await getSteps(webConfig.provider)(log, logInLoop, webConfig)(page)
            .then(reviews => reviews.filter(createReviewValidator(webConfig.ignoreReviews)))
    } catch (e: unknown) {
        if (e instanceof Error) {
            log(`There was an error scraping the ${webConfig.provider} provider: ${e.message}`)

            const screenshotPath = './result/last-error.jpeg'
            log(`Storing a screenshot in ${screenshotPath}...`)

            const bodyHandle = await page.$('body')
            const { width } = await bodyHandle?.boundingBox() || { width: 1920 }
            const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
            await page.screenshot({
                // captureBeyondViewport: true,
                // fullPage: true,
                path: screenshotPath,
                clip: {
                    x: 0,
                    y: 0,
                    width,
                    height: scrollHeight,
                }
            })
            log(`Screenshot stored`)
        }
        if (e instanceof ErrorWithHTML) {
            const htmlPath = './result/last-error.html'
            log(`The error contains html information. Storing html in ${htmlPath}...`)
            await writeFile('./result/last-error.html', e.html)
            log(`Html stored`)
        }

        throw e
    }
}
