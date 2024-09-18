import { WebConfig } from "../../config/config.js"
import { LogFunction } from "../../logger/logger.js"
import { Browser, ElementHandle, Milliseconds, Page, Selector, clickOrFail, evalOrElse, findAll, findOne, goto, scrollUntil, selectorByText, waitForNetworkIdle } from "../../puppeteer-actions.js"
import { Review, createReviewValidator } from "../../review.js"

const PROVIDER_NAME = 'bodasnet'
export const rejectCookiesText = 'Rechazarlas todas'
const reviewSelector = () => '.storefrontReviewsTileSubpage'
type ReviewDataSelectors = typeof reviewDataSelectors
const reviewDataSelectors = {
    authorNameSelector: () => '.storefrontReviewsTileInfo',
    ratingSelector: () => '.rating__count',
    contentSelector: () => '.app-full-description',
}

export const findRejectCookiesButton = (log: LogFunction, rejectCookiesText: string) => (page: Page) =>
    log('to get the reject cookies button', 
        async () => page.waitForSelector(selectorByText('button', rejectCookiesText), {timeout: 30000}))
export const rejectCookies = (log: LogFunction, timeout: Milliseconds, rejectCookiesText: string) => 
    async (page: Page) => {
    return log('to reject cookies', async () => 
        findRejectCookiesButton(log, rejectCookiesText)(page)
            .then(clickOrFail(log, 'to reject cookies'))
            .then(_ => waitForNetworkIdle(timeout)(page)))
}

const loadAllReviews = (log: LogFunction, timeout: Milliseconds) => scrollUntil(log, timeout)(async page => {
    const footer = findOne(log, 'to see if we arrived to the bottom of the page')('footer')(page)
    return footer !== null
})

const findAllReviews = (log: LogFunction, reviewSelector: Selector) => 
    findAll(log, 'to get all the reviews')(reviewSelector)

const scrapeAllReviews = (log: LogFunction, logOnLoop: LogFunction, reviewSelector: Selector, selectors: ReviewDataSelectors) =>
    async (page: Page) =>
    log(`get the reviews data`, async () => Promise.all(
        await findAllReviews(log, reviewSelector)(page)
            .then(reviewEls => reviewEls.map(scrapeReview(logOnLoop, selectors)))))

export const scrapeReview = (log: LogFunction, selectors: ReviewDataSelectors) => 
    async (review: ElementHandle): Promise<Review> => ({
    provider: PROVIDER_NAME, 
    rating: await findRatingElement(log, selectors)(review)
        .then(evalOrElse(rating => {
            const value = rating.textContent
            return Number(value ?? 0)
        }, () => 0))
        .then(Math.round),

    authorName: await findAuthorNameElement(log, selectors)(review)
        .then(evalOrElse(
            el => el.firstChild!.textContent!.trim(), 
            () => '')),

    content: await findContentElement(log, selectors)(review)
        .then(evalOrElse(el => el.textContent!.trim(), () => ''))
})
export const findRatingElement = (log: LogFunction, reviewDataSelectors: ReviewDataSelectors) => 
    findOne(log, 'to get the rating element')(reviewDataSelectors.ratingSelector())
export const findAuthorNameElement = (log: LogFunction, reviewDataSelectors: ReviewDataSelectors) =>
    findOne(log, 'to get the author name element')(reviewDataSelectors.authorNameSelector())
export const findContentElement = (log: LogFunction, reviewDataSelectors: ReviewDataSelectors) => 
    findOne(log, 'to get the content')(reviewDataSelectors.contentSelector())

export const createBodasNetReviewsScraper = 
    (log: LogFunction, logInLoop: LogFunction, browser: Browser) => 
    async (webConfig: WebConfig<'bodasnet'>): Promise<Review[]> => {
    const reviews = await browser.newPage()
        .then(page => {
            page.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
            })
            return page
        })
        .then(goto(webConfig.url))
        .then(loadAllReviews(log, webConfig.timeout))
        .then(scrapeAllReviews(log, logInLoop, reviewSelector(), reviewDataSelectors))
    return reviews.filter(createReviewValidator(webConfig.ignoreReviews))
}
