import { Provider, WebConfig } from "../config/config.js"
import { Log } from "../logger/logger.js"
import { getSteps } from "./providers/provider.js"
import { Browser, Page } from "./puppeteer-actions.js"
import { Review, createReviewValidator } from "./review.js"

export type Steps<P extends Provider>
    = (log: Log, logInLoop: Log, webConfig: WebConfig<P>)
    => (page: Page)
    => Promise<Review[]>

export const scrape = 
    async <P extends Provider>(log: Log, logInLoop: Log, browser: Browser, webConfig: WebConfig<P>) =>
    await browser.newPage()
        .then(getSteps(webConfig.provider)(log, logInLoop, webConfig))
        .then(reviews => reviews.filter(createReviewValidator(webConfig.ignoreReviews)))
