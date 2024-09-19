import { WebConfig } from "../../config/config.js"
import { LogFunction } from "../../logger/logger.js"
import { Browser, Page, goto } from "../../puppeteer-actions.js"
import { Review, createReviewValidator } from "../../review.js"
import { loadAllReviews } from "./setps/load-all-reviews.js"
import { scrapeAllReviews } from "./setps/scrape-all-reviews.js"

export const PROVIDER_NAME = 'bodasnet'
export const reviewSelectors = {
    authorNameSelector: '.storefrontReviewsTileInfo',
    ratingSelector: '.rating__count',
    contentSelector: '.app-full-description',
    reviewSelector: '.storefrontReviewsTileSubpage'
}
export type ReviewSelectors = typeof reviewSelectors

export const createBodasNetReviewsScraper = 
    (log: LogFunction, logInLoop: LogFunction, browser: Browser) => 
    async (webConfig: WebConfig<typeof PROVIDER_NAME>): Promise<Review[]> => {
    const reviews = await browser.newPage()
        .then(preparePageToAvoidCookiesBanner)
        .then(goto(webConfig.url))
        .then(loadAllReviews(log, webConfig.timeout))
        .then(scrapeAllReviews(log, logInLoop, reviewSelectors))
    return reviews.filter(createReviewValidator(webConfig.ignoreReviews))
}

const preparePageToAvoidCookiesBanner = (page: Page) => {
    page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
    })
    return page
}
