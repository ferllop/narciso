import { LogFunction } from "../../../logger/logger.js"
import { ElementHandle, Page, evalOrElse, findAll, findOne } from "../../../puppeteer-actions.js"
import { Review } from "../../../review.js"
import { PROVIDER_NAME, ReviewSelectors } from "../bodasnet.js"

export const scrapeAllReviews = (
    log: LogFunction, 
    logOnLoop: LogFunction, 
    selectors: ReviewSelectors
) => async (page: Page) =>
    log(`get the reviews data`, async () => 
        Promise.all(
            await findAll(log, 'to get all the reviews')(selectors.reviewSelector)(page)
                .then(reviewEls => reviewEls.map(scrapeReview(logOnLoop, selectors)))))

const scrapeReview = 
    (log: LogFunction, selectors: ReviewSelectors) => async (review: ElementHandle): Promise<Review> => ({
    provider: PROVIDER_NAME, 
    rating: await scrapeRating(log, selectors.ratingSelector, review),
    authorName: await scrapeAuthorName(log, selectors.authorNameSelector, review),
    content: await scrapeContent(log, selectors.contentSelector, review)
})

const scrapeRating = (
    log: LogFunction, ratingSelector: string, review: ElementHandle): Promise<number> =>
    findOne(log, 'to get the rating element')(ratingSelector)(review)
        .then(evalOrElse(
            rating => Number(rating.textContent ?? 0),
            () => 0))
        .then(Math.round)

const scrapeAuthorName =
    (log: LogFunction, authorNameSelector: string, review: ElementHandle): Promise<string> =>
    findOne(log, 'to get the author name element')(authorNameSelector)(review)
        .then(evalOrElse(
            el => el.firstChild!.textContent!.trim(), 
            () => ''))

const scrapeContent = 
    (log: LogFunction, contentSelector: string, review: ElementHandle): Promise<string> => 
    findOne(log, 'to get the content')(contentSelector)(review)
        .then(evalOrElse(
            el => el.textContent!.trim(), 
            () => ''))

